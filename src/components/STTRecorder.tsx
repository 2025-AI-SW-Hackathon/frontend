// components/STTRecorder.tsx

"use client";

import { useEffect, useRef, useState } from "react";

export default function STTRecorder() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws/audio");
    setSocket(ws);

    ws.onopen = () => console.log("WebSocket 연결됨");
    ws.onmessage = (event) => {
      console.log("서버 응답:", event.data); // STT 결과가 여기 들어옴
    };
    ws.onerror = (err) => console.error("WebSocket 오류:", err);
    ws.onclose = () => console.log("WebSocket 연결 종료됨");

    return () => {
      ws.close();
    };
  }, []);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(pcm.buffer);
        }
      };

      setIsRecording(true);
    } catch (err) {
      console.error("마이크 접근 실패:", err);
      alert("마이크 권한이 필요합니다.");
    }
  };

  const stopRecording = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();

    streamRef.current?.getTracks().forEach((track) => track.stop());

    processorRef.current = null;
    sourceRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;

    setIsRecording(false);
  };

  return (
    <button
      className={`px-4 py-2 rounded text-white transition ${
        isRecording ? "bg-red-500" : "bg-green-500"
      }`}
      onClick={isRecording ? stopRecording : startRecording}
    >
      {isRecording ? "녹음 중지" : "녹음 시작"}
    </button>
  );
}
