'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

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

  return (
    <div className="min-h-screen bg-[#f5f7ff] relative overflow-x-hidden">
      {/* 배경 데이터 시각화 */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='1200' height='800' viewBox='0 0 1200 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='gradientBg' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%23f8faff;stop-opacity:0.1'/%3E%3Cstop offset='30%25' style='stop-color:%232563eb;stop-opacity:0.005'/%3E%3Cstop offset='70%25' style='stop-color:%232563eb;stop-opacity:0.01'/%3E%3Cstop offset='100%25' style='stop-color:%23ffffff;stop-opacity:0.05'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,300 Q200,200 400,250 Q600,320 800,220 Q1000,150 1200,280 L1200,800 L0,800 Z' fill='url(%23gradientBg)'/%3E%3Cpath d='M0,350 Q150,250 300,300 Q450,380 600,280 Q750,180 900,320 Q1050,420 1200,250' fill='none' stroke='%232563eb' stroke-width='1' opacity='0.03'/%3E%3Cpath d='M0,400 Q200,300 400,380 Q600,450 800,350 Q1000,250 1200,380' fill='none' stroke='%232563eb' stroke-width='0.8' opacity='0.02'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      />

      <div className="flex min-h-screen">
        {/* 사이드바 */}
        <aside className="w-70 bg-white border-r border-[#e8ecf3] shadow-[4px_0_20px_rgba(0,0,0,0.04)] flex-shrink-0 relative">
          <div className="p-8 pb-6 border-b border-[#f5f7fa] bg-[#A8C7FA] text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-base backdrop-blur-sm border border-white/10">
                S
              </div>
              <div className="text-2xl font-bold text-shadow">Speak Note</div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/15 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 bg-white/90 text-[#A8C7FA] rounded-full flex items-center justify-center font-bold text-base shadow-lg">
                A
              </div>
              <div>
                <h4 className="text-base font-semibold mb-1">사용자</h4>
                <p className="text-sm opacity-80">대시보드</p>
              </div>
            </div>
          </div>
          
          <nav className="p-6 flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-[#A8C7FA] text-white shadow-[0_4px_15px_rgba(168,199,250,0.3)]">
                <div className="w-6 h-6 flex items-center justify-center text-lg">📊</div>
                <span className="font-medium">대시보드</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:text-[#A8C7FA] hover:bg-[#f0f4ff] hover:translate-x-1 font-medium">
                <div className="w-6 h-6 flex items-center justify-center text-lg">📚</div>
                <span>강의 기록</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:text-[#A8C7FA] hover:bg-[#f0f4ff] hover:translate-x-1 font-medium">
                <div className="w-6 h-6 flex items-center justify-center text-lg">⚙️</div>
                <span>설정</span>
              </div>
            </div>
          </nav>
          
          <div className="p-6 border-t border-[#f5f7fa] bg-[#fbfcfd]">
            <div className="space-y-2">
              <button 
                onClick={handleSignOut}
                className="w-full p-3 bg-[#f8f9fa] text-gray-600 rounded-lg font-semibold transition-all duration-200 hover:bg-[#e8ecf3] hover:text-gray-800 text-sm border border-[#e8ecf3]"
              >
                로그아웃
              </button>
            </div>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 bg-transparent">
          {/* 상단 네비게이션 */}
          <nav className="bg-white/95 backdrop-blur-xl border-b border-[rgba(232,236,243,0.8)] p-5 px-10 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-5">
              <h1 className="text-3xl font-extrabold text-[#A8C7FA]">
                대시보드
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <span>홈</span>
                <span>/</span>
                <span className="text-[#A8C7FA] font-semibold">대시보드</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleStartLecture}
                className="bg-[#A8C7FA] text-white border-none rounded-xl px-6 py-3 text-sm font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(168,199,250,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(168,199,250,0.4)] hover:bg-[#8bb3f7]"
              >
                강의 시작하기
              </button>
            </div>
          </nav>

          {/* 컨텐츠 영역 */}
          <div className="p-10 max-w-[1400px] mx-auto">
            {/* 학습 통계 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-[#1a1a1a] relative">
                학습 통계
                <div className="absolute bottom-0 left-0 w-15 h-1 bg-[#A8C7FA] rounded"></div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative border border-[rgba(232,236,243,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 bg-[#f0f4ff] rounded-xl flex items-center justify-center text-[#A8C7FA] text-xl">📈</div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 text-[#1a1a1a]">24</div>
                  <div className="text-gray-600 text-sm font-medium mb-3">누적 총신 수</div>
                  <div className="text-[#A8C7FA] text-xs font-semibold px-3 py-1 bg-[rgba(168,199,250,0.1)] rounded-full inline-block">+12% 지난 주 대비</div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative border border-[rgba(232,236,243,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 bg-[#f0f4ff] rounded-xl flex items-center justify-center text-[#A8C7FA] text-xl">🎯</div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 text-[#1a1a1a]">1,247</div>
                  <div className="text-gray-600 text-sm font-medium mb-3">총 성취 주석</div>
                  <div className="text-[#A8C7FA] text-xs font-semibold px-3 py-1 bg-[rgba(168,199,250,0.1)] rounded-full inline-block">+8% 지난 주 대비</div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative border border-[rgba(232,236,243,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 bg-[#f0f4ff] rounded-xl flex items-center justify-center text-[#A8C7FA] text-xl">⏰</div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 text-[#1a1a1a]">8시간</div>
                  <div className="text-gray-600 text-sm font-medium mb-3">이번 주 학습</div>
                  <div className="text-[#A8C7FA] text-xs font-semibold px-3 py-1 bg-[rgba(168,199,250,0.1)] rounded-full inline-block">목표 달성!</div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative border border-[rgba(232,236,243,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 bg-[#f0f4ff] rounded-xl flex items-center justify-center text-[#A8C7FA] text-xl">📋</div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 text-[#1a1a1a]">52</div>
                  <div className="text-gray-600 text-sm font-medium mb-3">평균 주석/강의</div>
                  <div className="text-[#A8C7FA] text-xs font-semibold px-3 py-1 bg-[rgba(168,199,250,0.1)] rounded-full inline-block">+15% 향상</div>
                </div>
              </div>
            </section>

            {/* 최근 강의 기록 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-[#1a1a1a] relative">
                최근 강의 기록
                <div className="absolute bottom-0 left-0 w-15 h-1 bg-[#A8C7FA] rounded"></div>
              </h2>
              <div className="relative bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[rgba(232,236,243,0.6)]">
                <button className="absolute top-1/2 -left-6 transform -translate-y-1/2 bg-white border-2 border-[#f0f4ff] rounded-full w-12 h-12 flex items-center justify-center cursor-pointer text-[#A8C7FA] shadow-[0_4px_20px_rgba(168,199,250,0.2)] z-10 transition-all duration-300 hover:bg-[#A8C7FA] hover:text-white hover:scale-110 text-xl font-bold">
                  ‹
                </button>
                <button className="absolute top-1/2 -right-6 transform -translate-y-1/2 bg-white border-2 border-[#f0f4ff] rounded-full w-12 h-12 flex items-center justify-center cursor-pointer text-[#A8C7FA] shadow-[0_4px_20px_rgba(168,199,250,0.2)] z-10 transition-all duration-300 hover:bg-[#A8C7FA] hover:text-white hover:scale-110 text-xl font-bold">
                  ›
                </button>
                
                <div className="flex gap-6 overflow-x-auto py-2 scroll-smooth">
                  <div className="bg-[#f8fafe] rounded-2xl p-6 min-w-80 flex items-center gap-5 border-2 border-[rgba(168,199,250,0.1)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(168,199,250,0.15)] hover:border-[rgba(168,199,250,0.3)]">
                    <div className="w-14 h-14 bg-[#dc4c3e] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-[0_4px_16px_rgba(220,76,62,0.3)]">
                      PDF
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-[#1a1a1a]">데이터베이스_시스템_3장.pdf</h3>
                      <div className="text-gray-600 text-sm font-medium">생성 주석: 47개 • 2024년 1월 15일</div>
                    </div>
                  </div>
                  <div className="bg-[#f8fafe] rounded-2xl p-6 min-w-80 flex items-center gap-5 border-2 border-[rgba(168,199,250,0.1)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(168,199,250,0.15)] hover:border-[rgba(168,199,250,0.3)]">
                    <div className="w-14 h-14 bg-[#dc4c3e] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-[0_4px_16px_rgba(220,76,62,0.3)]">
                      PDF
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-[#1a1a1a]">운영체제_프로세스관리.pdf</h3>
                      <div className="text-gray-600 text-sm font-medium">생성 주석: 63개 • 2024년 1월 12일</div>
                    </div>
                  </div>
                  <div className="bg-[#f8fafe] rounded-2xl p-6 min-w-80 flex items-center gap-5 border-2 border-[rgba(168,199,250,0.1)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(168,199,250,0.15)] hover:border-[rgba(168,199,250,0.3)]">
                    <div className="w-14 h-14 bg-[#dc4c3e] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-[0_4px_16px_rgba(220,76,62,0.3)]">
                      PDF
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-[#1a1a1a]">알고리즘_정렬_알고리즘.pdf</h3>
                      <div className="text-gray-600 text-sm font-medium">생성 주석: 38개 • 2024년 1월 10일</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-3 mt-8 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#A8C7FA] scale-125"></div>
                <div className="w-3 h-3 rounded-full bg-[#e8ecf3] cursor-pointer transition-all duration-300 hover:bg-[#A8C7FA] hover:opacity-70"></div>
                <div className="w-3 h-3 rounded-full bg-[#e8ecf3] cursor-pointer transition-all duration-300 hover:bg-[#A8C7FA] hover:opacity-70"></div>
              </div>
            </section>

            {/* 하단 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[rgba(232,236,243,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
                <h2 className="text-2xl font-bold mb-6 text-[#1a1a1a] relative">
                  AI 서비스 안내
                  <div className="absolute bottom-0 left-0 w-15 h-1 bg-[#A8C7FA] rounded"></div>
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#f8fafe] transition-all duration-200 hover:bg-[#f0f4ff] hover:translate-x-1">
                    <div className="w-10 h-10 bg-[#A8C7FA] rounded-xl flex items-center justify-center text-white text-base font-semibold flex-shrink-0">ℹ️</div>
                    <div>실시간 음성 인식으로 강의 내용을 자동 분석합니다</div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#f8fafe] transition-all duration-200 hover:bg-[#f0f4ff] hover:translate-x-1">
                    <div className="w-10 h-10 bg-[#A8C7FA] rounded-xl flex items-center justify-center text-white text-base font-semibold flex-shrink-0">💡</div>
                    <div>강의자료 기반 맞춤형 주석을 생성합니다</div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#f8fafe] transition-all duration-200 hover:bg-[#f0f4ff] hover:translate-x-1">
                    <div className="w-10 h-10 bg-[#A8C7FA] rounded-xl flex items-center justify-center text-white text-base font-semibold flex-shrink-0">📈</div>
                    <div>드래그앤드롭으로 주석 위치를 자유롭게 조정하세요</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[rgba(232,236,243,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
                <h2 className="text-2xl font-bold mb-6 text-[#1a1a1a] relative">
                  피드백
                  <div className="absolute bottom-0 left-0 w-15 h-1 bg-[#A8C7FA] rounded"></div>
                </h2>
                <textarea 
                  className="w-full border-2 border-[#f0f4ff] rounded-xl p-4 text-sm mb-4 resize-none min-h-24 transition-all duration-300 focus:border-[#A8C7FA] focus:outline-none focus:ring-4 focus:ring-[rgba(168,199,250,0.1)] font-inherit"
                  placeholder="서비스 개선을 위한 의견을 남겨주세요..."
                ></textarea>
                <button className="bg-[#A8C7FA] text-white border-none rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(168,199,250,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(168,199,250,0.4)] hover:bg-[#8bb3f7]">
                  피드백 보내기
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
