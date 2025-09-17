"use client";

import { useState, useEffect, useRef } from "react";
import AudioFilePlayer from "@/components/AudioFilePlayer";

export default function ExperimentPage() {
  const [isExperimentMode, setIsExperimentMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [config, setConfig] = useState({
    audioSegmentSize: 4096,
    slidingWindowSize: 0,
    threadCount: 1,
    bufferPolicy: "FIFO"
  });
  const [logs, setLogs] = useState<string[]>([]);
  
  // 오디오 파일 재생 관련 상태
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<"microphone" | "audiofile">("audiofile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const startExperiment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiment/start?sessionId=${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setIsRunning(true);
        addLog(`실험 시작됨: ${sessionId}`);
      } else {
        addLog(`실험 시작 실패: ${data.message}`);
      }
    } catch (error) {
      addLog(`실험 시작 오류: ${error}`);
    }
  };

  const stopExperiment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiment/stop?sessionId=${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setIsRunning(false);
        addLog(`실험 중지됨: ${sessionId}`);
      } else {
        addLog(`실험 중지 실패: ${data.message}`);
      }
    } catch (error) {
      addLog(`실험 중지 오류: ${error}`);
    }
  };

  const startAutoExperiment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiment/auto-start?sessionId=${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setIsRunning(true);
        addLog(`자동 실험 시작됨: ${sessionId}`);
      } else {
        addLog(`자동 실험 시작 실패: ${data.message}`);
      }
    } catch (error) {
      addLog(`자동 실험 시작 오류: ${error}`);
    }
  };

  const toggleExperimentMode = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiment/toggle-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setIsExperimentMode(data.experimentMode);
        addLog(`실험 모드 ${data.experimentMode ? "활성화" : "비활성화"}됨`);
      } else {
        addLog(`실험 모드 토글 실패: ${data.message}`);
      }
    } catch (error) {
      addLog(`실험 모드 토글 오류: ${error}`);
    }
  };

  const updateConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiment/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });
      
      const data = await response.json();
      if (data.success) {
        addLog(`설정 업데이트됨: ${JSON.stringify(config)}`);
      } else {
        addLog(`설정 업데이트 실패: ${data.message}`);
      }
    } catch (error) {
      addLog(`설정 업데이트 오류: ${error}`);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiment/export?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        addLog(`데이터 내보내기 완료: ${data.data}`);
      } else {
        addLog(`데이터 내보내기 실패: ${data.message}`);
      }
    } catch (error) {
      addLog(`데이터 내보내기 오류: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // 오디오 파일 관련 함수들
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      addLog(`오디오 파일 선택됨: ${file.name}`);
    } else {
      addLog("오디오 파일을 선택해주세요.");
    }
  };

  const startAudioPlayback = () => {
    if (!audioFile) {
      addLog("오디오 파일을 먼저 선택해주세요.");
      return;
    }
    setIsPlaying(true);
    addLog("오디오 파일 재생 시작");
  };

  const stopAudioPlayback = () => {
    setIsPlaying(false);
    addLog("오디오 파일 재생 중지");
  };

  const handlePlaybackComplete = () => {
    setIsPlaying(false);
    addLog("오디오 파일 재생 완료");
  };

  useEffect(() => {
    // 세션 ID 자동 생성
    setSessionId(`session_${Date.now()}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          실시간 STT 지연 시간 최적화 실험
        </h1>

        {/* 실험 모드 토글 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">실험 모드</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleExperimentMode}
              className={`px-4 py-2 rounded-md font-medium ${
                isExperimentMode
                  ? "bg-green-500 text-white"
                  : "bg-gray-500 text-white"
              }`}
            >
              {isExperimentMode ? "실험 모드 활성화됨" : "실험 모드 비활성화됨"}
            </button>
            <span className="text-sm text-gray-600">
              현재 상태: {isExperimentMode ? "활성화" : "비활성화"}
            </span>
          </div>
        </div>

        {/* 실험 설정 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">실험 설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                오디오 세그먼트 크기 (샘플)
              </label>
              <select
                value={config.audioSegmentSize}
                onChange={(e) => setConfig({...config, audioSegmentSize: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2048}>2048 (0.125초)</option>
                <option value={4096}>4096 (0.25초)</option>
                <option value={8192}>8192 (0.5초)</option>
                <option value={16384}>16384 (1초)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                슬라이딩 윈도우 크기 (초)
              </label>
              <select
                value={config.slidingWindowSize}
                onChange={(e) => setConfig({...config, slidingWindowSize: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>0 (비활성화)</option>
                <option value={1}>1초</option>
                <option value={2}>2초</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                스레드 수
              </label>
              <select
                value={config.threadCount}
                onChange={(e) => setConfig({...config, threadCount: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1개</option>
                <option value={2}>2개</option>
                <option value={4}>4개</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                버퍼 정책
              </label>
              <select
                value={config.bufferPolicy}
                onChange={(e) => setConfig({...config, bufferPolicy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FIFO">FIFO (선입선출)</option>
                <option value="DROP">DROP (드롭)</option>
                <option value="BLOCK">BLOCK (블로킹)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={updateConfig}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              설정 업데이트
            </button>
          </div>
        </div>

        {/* 실험 모드 선택 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">실험 모드 선택</h2>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="microphone"
                checked={playbackMode === "microphone"}
                onChange={(e) => setPlaybackMode(e.target.value as "microphone" | "audiofile")}
                className="mr-2"
              />
              마이크 입력 (실제 음성)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="audiofile"
                checked={playbackMode === "audiofile"}
                onChange={(e) => setPlaybackMode(e.target.value as "microphone" | "audiofile")}
                className="mr-2"
              />
              오디오 파일 재생
            </label>
          </div>
          
          {playbackMode === "audiofile" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  오디오 파일 선택
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              {audioFile && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={startAudioPlayback}
                    disabled={isPlaying}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isPlaying ? "재생 중..." : "재생 시작"}
                  </button>
                  
                  <button
                    onClick={stopAudioPlayback}
                    disabled={!isPlaying}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    재생 중지
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    선택된 파일: {audioFile.name}
                  </span>
                </div>
              )}
              
              <AudioFilePlayer
                fileId={sessionId}
                audioFile={audioFile}
                isPlaying={isPlaying}
                onPlaybackComplete={handlePlaybackComplete}
              />
            </div>
          )}
        </div>

        {/* 실험 제어 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">실험 제어</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={startExperiment}
              disabled={isRunning}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              실험 시작
            </button>
            
            <button
              onClick={startAutoExperiment}
              disabled={isRunning}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              자동 실험 시작
            </button>
            
            <button
              onClick={stopExperiment}
              disabled={!isRunning}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              실험 중지
            </button>
            
            <button
              onClick={exportData}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              데이터 내보내기
            </button>
          </div>
        </div>

        {/* 로그 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">실험 로그</h2>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              로그 지우기
            </button>
          </div>
          
          <div className="bg-gray-100 rounded-md p-4 h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">로그가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
