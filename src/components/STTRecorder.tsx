"use client";

import { useEffect, useRef, useState } from "react";
import { useAnnotation } from "./AnnotationContext";
import Image from "next/image";
import PLAY from "@/components/image/play.svg";
import STOP from "@/components/image/stop.svg";

export default function STTRecorder() {
  const { addAnnotation } = useAnnotation();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // 초 단위 시간
  const API_WSS_URL = process.env.NEXT_PUBLIC_API_WSS_URL;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      const ws = new WebSocket(API_WSS_URL!);
      setSocket(ws);

      ws.onopen = async () => {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          alert("현재 브라우저가 마이크 권한을 지원하지 않거나 잘못된 환경입니다.");
          return;
        }
        try {const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const pcm = convertFloat32ToInt16(input);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(pcm.buffer);
          }}}
          catch (err) {
            console.error("로그인 오류:", err);
            alert("로그인을 하셔야 이용 가능합니다.");
          
        
        };

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

    clearInterval(intervalRef.current!);
    intervalRef.current = null;
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
  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 bg-white text-gray-700 text-sm"
  onClick={startRecording}
>
  <div className="w-3 h-4 flex items-center justify-center">
    <div className="w-3 h-4 relative">
      <div className="w-3 h-4 bg-transparent absolute top-0 left-0" />
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Image src={PLAY} alt="Play" width={15} height={15} />
    <span className="text-gray-700 text-sm">녹음 시작</span>
  </div>
</button>
      )}
    </div>
  );
}
