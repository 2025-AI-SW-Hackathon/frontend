// components/Header.tsx
"use client";

import Image from "next/image";
import STTRecorder from "@/components/STTRecorder";

interface HeaderProps {
  fileName?: string; // 파일명을 optional하게 props로 받음
}

export default function Header({ fileName }: HeaderProps) {
  return (
    <header className="w-full h-[75px] flex items-center justify-between px-6 border-b border-gray-200 bg-white">
      <div>
        <h2 className="text-base font-semibold leading-[28px] text-gray-800">Speak-Note</h2>
        <p className="text-sm text-gray-500 leading-[20px]">
          {fileName ?? "강의자료 이름"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <STTRecorder />
      </div>
    </header>
  );
}
