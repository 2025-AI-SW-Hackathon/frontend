"use client";

import { useEffect, useRef, useState } from "react";
import { useAnnotation } from "./AnnotationContext";

type AudioFilePlayerProps = {
  fileId?: string | number | null;
  audioFile?: File | null;
  isPlaying: boolean;
  onPlaybackComplete: () => void;
};

export default function AudioFilePlayer({ 
  fileId, 
  audioFile, 
  isPlaying, 
  onPlaybackComplete 
}: AudioFilePlayerProps) {
  const { addAnnotation } = useAnnotation();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const API_WSS_URL = process.env.NEXT_PUBLIC_API_WSS_URL;

  // 오디오 파일을 16kHz PCM으로 변환
  const convertAudioToPCM = async (audioBuffer: AudioBuffer): Promise<Int16Array> => {
    const sampleRate = 16000;
    const inputSampleRate = audioBuffer.sampleRate;
    const inputLength = audioBuffer.length;
    const outputLength = Math.floor((inputLength * sampleRate) / inputSampleRate);
    
    const inputData = audioBuffer.getChannelData(0);
    const outputData = new Int16Array(outputLength);
    
    // 간단한 리샘플링 (선형 보간)
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = (i * inputSampleRate) / sampleRate;
      const index = Math.floor(inputIndex);
      const fraction = inputIndex - index;
      
      if (index + 1 < inputLength) {
        const sample = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
        outputData[i] = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      } else {
        outputData[i] = inputData[index] * 0x7FFF;
      }
    }
    
    return outputData;
  };

  // WebSocket 연결
  const connectWebSocket = () => {
    if (!API_WSS_URL) return;
    
    const url = new URL(API_WSS_URL);
    url.searchParams.set("fileId", String(fileId));
    const ws = new WebSocket(url.toString());
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket 연결됨 (오디오 파일 재생 모드)");
    };

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      
      // T5: 프론트 UI에 결과 표시 시점 기록
      const chunkId = parsed.chunkId || `unknown_${Date.now()}`;
      console.log(`[T5] Chunk: ${chunkId}, Time: ${Date.now()}`);
      
      addAnnotation({
        id: crypto.randomUUID(),
        text: event.data,
        markdown: null,
        answerState: parsed.answerState ?? 1,
        pageNumber: parsed.pageNumber, 
      });
      window.dispatchEvent(new Event("annotation-added"));
    };

    ws.onerror = (err) => {
      console.error("WebSocket 오류:", err);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };
  };

  // 오디오 파일 재생 및 STT 전송
  const playAudioFile = async () => {
    if (!audioFile || !socket || !isConnected) return;

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const pcmData = await convertAudioToPCM(audioBuffer);
      
      // 4096 샘플씩 청크로 나누어 전송
      const chunkSize = 4096;
      const totalChunks = Math.ceil(pcmData.length / chunkSize);
      
      startTimeRef.current = Date.now();
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, pcmData.length);
        const chunk = pcmData.slice(start, end);
        
        // T1: 마이크 입력 시작 시점 기록 (오디오 파일 재생 시작)
        const chunkId = `chunk_${Date.now()}_${i}`;
        console.log(`[T1] Chunk: ${chunkId}, Time: ${Date.now()}`);
        
        // T2: 세그먼트 전송 시점 기록
        console.log(`[T2] Chunk: ${chunkId}, Time: ${Date.now()}`);
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(chunk.buffer);
          socket.send(JSON.stringify({ 
            type: "init", 
            fileId: fileId, 
            chunkId: chunkId 
          }));
        }
        
        // 진행률 업데이트
        setPlaybackProgress((i + 1) / totalChunks * 100);
        
        // 청크 간 간격 (실시간 재생 시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log("오디오 파일 재생 완료");
      onPlaybackComplete();
      
    } catch (error) {
      console.error("오디오 파일 재생 오류:", error);
    }
  };

  // 실험 시작/중지
  useEffect(() => {
    if (isPlaying && audioFile) {
      connectWebSocket();
    } else if (!isPlaying && socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isPlaying, audioFile]);

  // WebSocket 연결 후 오디오 재생
  useEffect(() => {
    if (isConnected && isPlaying && audioFile) {
      playAudioFile();
    }
  }, [isConnected, isPlaying, audioFile]);

  // 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (socket) {
        socket.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-4">
      {isPlaying ? (
        <>
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[#e8f0fe] text-[#1a2b49] text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span>오디오 재생 중 - {playbackProgress.toFixed(1)}%</span>
          </div>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${playbackProgress}%` }}
            ></div>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-600">
          {isConnected ? "연결됨" : "연결 대기 중"}
        </div>
      )}
    </div>
  );
}
