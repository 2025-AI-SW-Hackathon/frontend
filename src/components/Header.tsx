// components/Header.tsx
"use client";

import Image from "next/image";
import STTRecorder from "@/components/STTRecorder";
interface HeaderProps {
  fileName?: string; // 파일명을 optional하게 props로 받음
}

export default function Header({ fileName }: HeaderProps) {

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">강의 사용</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>홈</span>
            <span>/</span>
            <span>강의 사용</span>
            {fileName && (
              <>
                <span>/</span>
                <span className="text-gray-700 font-medium">{fileName}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <STTRecorder />
        </div>
      </div>
    </header>
  );
}
