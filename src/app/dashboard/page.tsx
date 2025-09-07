'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleStartLecture = () => {
    router.push('/home');
  };

  const promotionalCards = [
    {
      title: "실시간 STT로 강의를 놓치지 마세요",
      description: "말하는 속도를 따라가는 실시간 음성인식",
      icon: "🎤",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "AI 요약으로 핵심만 빠르게 파악하세요",
      description: "GPT 기반 자동 요약과 주석 생성",
      icon: "🧠",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "모르는 개념은 AI가 자동으로 설명해드려요",
      description: "RAG 기반 실시간 개념 보강 시스템",
      icon: "💡",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  const lectureSessions = [
    {
      title: "데이터베이스 설계 원리",
      preview: "정규화의 개념과 1NF, 2NF, 3NF의 차이점에 대해 설명합니다. 관계형 데이터베이스에서 중복을 제거하고...",
      type: "실시간 강의",
      date: "3.27 목 오후 5:48",
      duration: "74분",
      status: "완료",
      hasTranscript: true,
      icon: "notebook.png",
    },
    {
      title: "머신러닝 기초 이론",
      preview: "지도학습과 비지도학습의 차이점을 알아보고, 선형회귀와 로지스틱 회귀의 수학적 원리를 다룹니다...",
      type: "실시간 강의",
      date: "3.27 목 오후 3:35",
      duration: "112분",
      status: "완료",
      icon: "bookmark.png",
    },
    {
      title: "웹 개발 프레임워크 비교",
      preview: "React, Vue, Angular의 특징과 장단점을 비교분석하고, 프로젝트 상황에 맞는 선택 기준을 제시합니다...",
      type: "실시간 강의",
      date: "3.25 월 오후 5:48",
      duration: "75분",
      status: "완료",
      icon: "folder.png",
    },
    {
      title: "알고리즘 복잡도 분석",
      preview: "시간복잡도와 공간복잡도의 개념을 이해하고, Big O 표기법을 활용한 알고리즘 성능 분석 방법을...",
      type: "실시간 강의",
      date: "3.25 월 오후 2:36",
      duration: "58분",
      status: "진행중",
      hasTranscript: true,
      icon: "meno.png",
    },
    {
      title: "네트워크 프로토콜 심화",
      preview: "TCP/IP 프로토콜 스택의 각 계층별 역할과 HTTP/HTTPS의 동작 원리, 보안 메커니즘에 대해...",
      type: "실시간 강의",
      date: "3.20 목 오후 5:49",
      duration: "77분",
      status: "완료",
      icon: "spring-note.png",
    },
    {
      title: "클라우드 컴퓨팅 개론",
      preview: "IaaS, PaaS, SaaS의 차이점과 AWS, Azure, GCP의 주요 서비스들을 비교하며 클라우드 아키텍처...",
      type: "실시간 강의",
      date: "3.20 목 오후 2:35",
      duration: "56분",
      status: "완료",
      hasTranscript: true,
      icon: "stick-memo.png",
    },
  ];

  const usefulFeatures = [
    { title: "실시간 음성인식 (STT)", icon: "🔊" },
    { title: "AI 자동 요약 생성", icon: "📄" },
    { title: "개념 자동 보강 설명", icon: "📚" },
    { title: "PDF 슬라이드 연동", icon: "🎵" },
    { title: "세션별 복습 기능", icon: "▶️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* 사이드바 */}
        <Sidebar />

        {/* 메인 컨텐츠 */}
        <main className="flex-1">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">강의 관리</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>홈</span>
                  <span>/</span>
                  <span>대시보드</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src="/search.png"
                    alt="Search icon"
                    width={16}
                    height={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  />
                  <input
                    type="text"
                    placeholder="강의 검색"
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C7FA]"
                  />
                </div>
                <button 
                  onClick={handleStartLecture}
                  className="bg-[#A8C7FA] hover:bg-[#8bb3f7] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  강의 녹음 시작
                </button>
              </div>
            </div>
          </header>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {promotionalCards.map((card, index) => (
                <div key={index} className={`${card.bgColor} border-0 p-6 rounded-lg relative overflow-hidden shadow-sm`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-tight">{card.title}</h3>
                      <p className="text-xs text-gray-600">{card.description}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${card.iconColor} bg-white/50`}>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <button className="bg-[#A8C7FA] hover:bg-[#8bb3f7] text-white px-4 py-2 rounded-lg text-sm font-medium">
                최근 강의
              </button>
              <button className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">
                완료된 강의
              </button>
            </div>

            <div className="space-y-0 bg-white rounded-lg border border-gray-200 shadow-sm">
              {lectureSessions.map((session, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-[#A8C7FA]/10"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    <Image
                      src={`/file/${session.icon}`}
                      alt="강의 아이콘"
                      width={24}
                      height={24}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {session.title}
                        {session.hasTranscript && <span className="ml-2 text-[#A8C7FA]">●</span>}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          session.status === "진행중" ? "bg-green-100 text-green-700" : "bg-[#A8C7FA]/20 text-[#A8C7FA]"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{session.preview}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{session.type}</span>
                      <div className="flex items-center gap-4">
                        <span>{session.date}</span>
                        <span>{session.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* 오른쪽 패널 */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">2025.9</h2>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-[#A8C7FA] hover:bg-[#A8C7FA]/10 rounded">
                    <span className="text-sm">‹</span>
                  </button>
                  <button className="p-1 text-[#A8C7FA] hover:bg-[#A8C7FA]/10 rounded">
                    <span className="text-sm">›</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                <div>일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div>토</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-sm">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 6 + 1;
                  const isCurrentMonth = day > 0 && day <= 30;
                  const isToday = day === 7;
                  return (
                    <div
                      key={i}
                      className={`h-8 flex items-center justify-center rounded ${
                        isToday
                          ? "bg-[#A8C7FA] text-white"
                          : isCurrentMonth
                            ? "text-gray-900 hover:bg-[#A8C7FA]/10"
                            : "text-gray-300"
                      }`}
                    >
                      {isCurrentMonth ? day : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Speak Note 핵심 기능</h3>
              <div className="space-y-3">
                {usefulFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-[#A8C7FA]">{feature.icon}</span>
                    <span>{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="bg-gradient-to-br from-[#A8C7FA]/10 to-[#A8C7FA]/5 rounded-lg p-4 text-center border border-[#A8C7FA]/20">
                <div className="text-sm text-gray-600 mb-2">새로운 강의</div>
                <div className="text-sm text-gray-600">녹음하는 방법</div>
                <div className="mt-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#A8C7FA]/20 to-[#A8C7FA]/10 rounded-lg mx-auto flex items-center justify-center">
                    <span className="text-2xl text-[#A8C7FA]">🎤</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}