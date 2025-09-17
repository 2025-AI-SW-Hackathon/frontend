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
  const demoTimersRef = useRef<NodeJS.Timeout[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileIdRef = useRef<typeof fileId>(fileId);
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
      url.searchParams.set("fileId", String(fileIdRef.current));
      const ws = new WebSocket(url.toString());
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
          
          // T1: 마이크 입력 시작 시점 기록
          const chunkId = `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log(`[T1] Chunk: ${chunkId}, Time: ${Date.now()}`);
          
          if (ws.readyState === WebSocket.OPEN) {
            // T2: 세그먼트 전송 시점 기록
            console.log(`[T2] Chunk: ${chunkId}, Time: ${Date.now()}`);
            ws.send(pcm.buffer);
            ws.send(JSON.stringify({ type: "init", fileId: fileIdRef.current, chunkId: chunkId }));
          }
        }}
          catch (err) {
            console.error("로그인 오류:", err);
            alert("로그인을 하셔야 이용 가능합니다.");
          
        
        };

        setIsRecording(true);
        setRecordingTime(0);
        intervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

        // ===== 데모 타이머 기반 주석 주입 =====
        // 공통 헬퍼
        const add = (payload: any) => {
          addAnnotation({
            id: crypto.randomUUID(),
            text: JSON.stringify(payload),
            markdown: null,
            answerState: payload.answerState,
            pageNumber: payload.pageNumber,
          });
          window.dispatchEvent(new Event("annotation-added"));
        };

        // 1) 00:20 → 2페이지: 자료기반 + 음성(대본 그대로)
        demoTimersRef.current.push(setTimeout(() => {
          add({
            pageNumber: 2,
            answerState: 0, // 자료 기반(기본 카드)
            refinedText: [
              "- 오늘의 목표: 컨테이너 개념과 Docker의 기본 이해",
              "- 맥락: 강의 도입부로 주제와 기대 효과 제시",
            ].join("\n"),
            voice:
              "안녕하세요. 오늘은 클라우드 컴퓨팅 수업의 한 부분인 도커 기초에 대해 이야기해 보겠습니다. 요즘 개발자들이 “컨테이너, 컨테이너” 하는데, 이게 뭔지 감이 잘 안 오실 수 있죠. 오늘은 그 기본을 잡아보겠습니다.",
          });
        }, 20_000));

        // 2) 01:00 → 3페이지: 자료기반 + 음성(대본 그대로)
        demoTimersRef.current.push(setTimeout(() => {
          add({
            pageNumber: 3,
            answerState: 0, // 자료 기반
            refinedText: [
              "- 분류: 호스트(예: VirtualBox) / 하이퍼바이저(예: VMware, KVM) / 컨테이너(Docker)",
              "- 핵심 차이: VM=독립 OS 포함(무겁고 격리 강함), 컨테이너=OS 커널 공유(가볍고 빠름)",
              "- 비유: VM은 ‘방 새로 짓기’, 컨테이너는 ‘같은 집에서 방만 나눠 쓰기’",
            ].join("\n"),
            voice: [
              "우선 저번 시간 내용부터 복습해 봅시다. 가상화 기술에는 세 가지 종류가 있었죠?",
              "첫번째로, 호스트 가상화가 있었습니다. VirtualBox 같은 거죠.",
              "두번째로, 하이퍼바이저 가상화도 있었죠. VMware, KVM 같은 전통적인 가상머신 방식입니다.",
              "마지막으로 컨테이너 가상화인데, 이 부분에 오늘의 주인공 Docker가 속합니다.",
              "쉽게 말하면, 가상머신은 무거운 “방 한 칸 통째로 새로 짓는” 방식이고, 컨테이너는 “같은 집 안에서 방만 나눠 쓰는” 방식이라고 생각하면 됩니다.",
            ].join("\n\n"),
          });
        }, 60_000));

        // 3) 01:33 → 7페이지: 자료기반 + 음성(대본 그대로)
        demoTimersRef.current.push(setTimeout(() => {
          add({
            pageNumber: 8,
            answerState: 0, // 자료 기반
            refinedText: [
              "- 패키징: 어떤 애플리케이션도 이미지로 묶어 이식성↑",
              "- 일관 배포: 개발-테스트-운영 환경 차이를 최소화",
              "- 성능: 게스트 OS가 없어 오버헤드↓, 시작이 빠름",
            ].join("\n"),
            voice: [
              "도커는 컨테이너를 쉽게 사용할 수 있게 만든 오픈소스 플랫폼입니다.",
              "특징은 다음과 같아요:",
              "- 어떤 프로그램이든 컨테이너로 패키징 가능하다.",
              "- 환경 설치 반복이 필요 없다.",
              "- 게스트 OS가 없으므로 오버헤드가 줄고 빠르다.",
              "제가 처음 도커를 접했을 때, `docker run hello-world` 명령을 쳤는데 바로 실행되는 걸 보고 “이거 마법 아니야?” 했던 기억이 납니다.",
            ].join("\n"),
          });
        }, 93_000));

        // 4) 02:03 → 6페이지: 음성 주석 (대본 그대로)
        demoTimersRef.current.push(setTimeout(() => {
          add({
            pageNumber: 6,
            answerState: 1,  // 외부 검색 주석 카드
            refinedText: [
              "Podman 요약",
              "- 데몬 없는 컨테이너 엔진, 루트리스 모드 지원",
              "- 보안상 이점, 리눅스 배포판 채택 증가",
              "- Docker 유사 CLI: podman run ...",
              "- systemd 통합 등 운영 편의",
            ].join("\n"),
            voice: [
              "사실 도커 하나만 있는 게 아닙니다. 컨테이너라는 큰 범주 안에서 여러 기술들이 나왔는데요, 이건 그냥 상식으로 알고 계세요.",
              "예를 들어 **Podman** 같은 게 있습니다.",
              "- ‘도커를 대체한다’는 말 많이 들어보셨을 거예요.",
              "- 거의 도커랑 똑같이 쓰지만, 차이점은 데몬이 없다는 겁니다.",
              "- 그래서 보안적으로 더 안전하다고 평가되기도 하고, 최근 리눅스 배포판에서는 도커 대신 Podman을 쓰는 경우도 많습니다.",
            ].join("\n"),
          });
        }, 123_000));
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
    // 데모 타이머 해제
    demoTimersRef.current.forEach((t) => clearTimeout(t));
    demoTimersRef.current = [];

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
