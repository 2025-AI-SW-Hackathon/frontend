"use client";

import { useEffect, useRef, useState } from "react";
import { useAnnotation } from "./AnnotationContext";
import Image from "next/image";
import PLAY from "@/components/image/play.svg";
import STOP from "@/components/image/stop.svg";

type STTRecorderProps = {
  fileId?: string | number | null;
};

export default function STTRecorder({ fileId }: STTRecorderProps) {
  const { addAnnotation } = useAnnotation();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // 초 단위 시간
  const API_WSS_URL = process.env.NEXT_PUBLIC_API_WSS_URL;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileIdRef = useRef<typeof fileId>(fileId);
  const hasSentFirstAudioRef = useRef<boolean>(false);
  useEffect(() => { fileIdRef.current = fileId; }, [fileId]);
  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `00:${mins}:${secs}`;
  };

  const convertFloat32ToInt16 = (buffer: Float32Array) => {
    const l = buffer.length;
    const result = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      result[i] = Math.floor(result[i]);
    }
    return result;
  };

  const startRecording = async () => {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_API_WSS_URL!);
      // fileId가 있으면 쿼리에 포함, 없으면 생략하여 STT만 테스트 가능
      if (fileIdRef.current !== undefined && fileIdRef.current !== null && String(fileIdRef.current) !== "") {
        url.searchParams.set("fileId", String(fileIdRef.current));
      }
      const ws = new WebSocket(url.toString());
      setSocket(ws);

      ws.onopen = async () => {
        // 무음 keep-alive 시작 (마이크 준비 전 타임아웃 방지)
        if (!keepAliveIntervalRef.current) {
          keepAliveIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN && !hasSentFirstAudioRef.current) {
              const silentFrame = new Int16Array(1600); // 약 100ms @ 16kHz
              ws.send(silentFrame.buffer);
            }
          }, 200); // 200ms 간격
        }
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          alert("현재 브라우저가 마이크 권한을 지원하지 않거나 잘못된 환경입니다.");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const audioContext = new AudioContext({ sampleRate: 16000 }); // 최적의 파라미터 (16kHz)
          audioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          sourceRef.current = source;

          const processor = audioContext.createScriptProcessor(4096, 1, 1); // 최적의 파라미터 (4096 샘플)
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(audioContext.destination);

          processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            const pcm = convertFloat32ToInt16(input);
            if (ws.readyState === WebSocket.OPEN) {
              // 첫 실제 오디오 프레임 전송 시 keep-alive 중지
              if (!hasSentFirstAudioRef.current) {
                hasSentFirstAudioRef.current = true;
                if (keepAliveIntervalRef.current) {
                  clearInterval(keepAliveIntervalRef.current);
                  keepAliveIntervalRef.current = null;
                }
              }
              ws.send(pcm.buffer);
              // fileId 없이도 동작하도록 init 메시지는 선택적으로만 전송
              if (fileIdRef.current !== undefined && fileIdRef.current !== null && String(fileIdRef.current) !== "") {
                ws.send(JSON.stringify({ type: "init", fileId: fileIdRef.current }));
              }
            }
          };
        } catch (err) {
          console.error("로그인 오류:", err);
          alert("로그인을 하셔야 이용 가능합니다.");
        }

        setIsRecording(true);
        setRecordingTime(0);
        intervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      ws.onmessage = (event) => {
        const parsed = JSON.parse(event.data);
        addAnnotation({
          id: crypto.randomUUID(),
          text: event.data,
          markdown: null,
          answerState: parsed.answerState ?? 1,
          pageNumber:parsed.pageNumber, 
        });
        window.dispatchEvent(new Event("annotation-added"));

      };

      ws.onerror = (err) => {
        console.error("WebSocket 오류:", err);
      };

      ws.onclose = () => {
        stopRecordingInternal();
        setSocket(null);
      };
    } catch (err) {
      alert("마이크 권한이 필요하거나 연결에 실패했습니다.");
    }
  };

  const stopRecordingInternal = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    processorRef.current = null;
    sourceRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    hasSentFirstAudioRef.current = false;

    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const stopRecording = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.close();
    } else {
      stopRecordingInternal();
      setSocket(null);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {isRecording ? (
        <>
          {/* 녹음 중 - 시간 표시 */}
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[#e8f0fe] text-[#1a2b49] text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span>녹음 중 - {formatTime(recordingTime)}</span>
          </div>
          {/* 녹음 중지 버튼 */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-400 text-gray-800 text-sm bg-white"
            onClick={stopRecording}
          >
            <Image src={STOP} alt="Stop" width={14} height={14} />
            <span>녹음 중지</span>
          </button>
        </>
      ) : (
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-400 text-gray-800 text-sm bg-white"
            onClick={startRecording}
          >
          <Image src={PLAY} alt="Play" width={14} height={14} />
          <span className="text-gray-700 text-sm">녹음 시작</span>
        </button>
      )}
    </div>
  );
}
