// components/Header.tsx
"use client";

import Image from "next/image";
import STTRecorder from "@/components/STTRecorder";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

interface HeaderProps {
  fileName?: string; // 파일명을 optional하게 props로 받음
}

export default function Header({ fileName }: HeaderProps) {
  const { user, signIn, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      router.push("/auth/signin");
    }
  };

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
        <button
          onClick={handleAuthAction}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {isAuthenticated ? `${user?.name || '사용자'} 로그아웃` : '로그인'}
        </button>
      </div>
    </header>
  );
}
