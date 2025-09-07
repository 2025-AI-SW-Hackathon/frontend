"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Image from "next/image";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [showCollapseButton, setShowCollapseButton] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [guestAvatar, setGuestAvatar] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, isAuthenticated, loading, setUserFromTokens } = useAuth();

  // 아바타 이미지 설정
  useEffect(() => {
    // 로딩 중이면 아바타 설정하지 않음
    if (loading) return;

    const avatarImages = [
      "carrot.png", 
      "dolphin.png", 
      "duck.png", 
      "earth.png", 
      "fire.png", 
      "star.png", 
      "sunset.png", 
      "tree1.png", 
      "tree2.png", 
      "trophy.png"
    ];

    if (isAuthenticated && user?.id) {
      // 로그인한 사용자: ID 기반으로 고정된 이미지 선택
      const userIndex = user.id % avatarImages.length;
      setGuestAvatar(avatarImages[userIndex]);
    } else if (!isAuthenticated) {
      // 게스트: 랜덤 이미지 선택
      const randomIndex = Math.floor(Math.random() * avatarImages.length);
      setGuestAvatar(avatarImages[randomIndex]);
    }
  }, [isAuthenticated, user?.id, loading]);

  // 로그인 상태가 변경될 때 사용자 정보 다시 가져오기
  useEffect(() => {
    if (isAuthenticated && !user && !loading) {
      setUserFromTokens();
    }
  }, [isAuthenticated, user, loading, setUserFromTokens]);

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await signOut();
      router.push('/');
    } else {
      router.push('/auth/signin');
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSidebarMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowCollapseButton(true);
  };

  const handleSidebarMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowCollapseButton(false);
    }, 500); // 0.5초 지연
    setHoverTimeout(timeout);
  };

  const menuItems = [
    {
      path: '/dashboard',
      label: '대시보드',
      icon: '📊',
      isActive: pathname === '/dashboard'
    },
    {
      path: '/home',
      label: '강의 사용',
      icon: '📚',
      isActive: pathname === '/home'
    },
    {
      path: '/settings',
      label: '설정',
      icon: '⚙️',
      isActive: pathname === '/settings'
    }
  ];

  return (
    <>
      {/* 펼치기 버튼 (왼쪽 화면 끝에 hover 시 나타남) */}
      {isCollapsed && (
        <div 
          className="fixed left-0 top-0 h-full w-4 z-50"
          onMouseEnter={() => setShowExpandButton(true)}
          onMouseLeave={() => setShowExpandButton(false)}
        >
          <button
            onClick={toggleCollapse}
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-12 bg-[#A8C7FA] text-white rounded-r-lg shadow-lg transition-all duration-300 flex items-center justify-center hover:bg-[#8bb3f7] ${
              showExpandButton ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            }`}
          >
            ›
          </button>
        </div>
      )}

      {/* 접기 버튼 (사이드바가 열려있을 때 hover 시 나타남) */}
      {!isCollapsed && (
        <button
          onClick={toggleCollapse}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
          className={`absolute top-1/2 left-[280px] transform -translate-y-1/2 w-8 h-12 bg-[#A8C7FA] text-white rounded-l-lg shadow-lg transition-all duration-300 flex items-center justify-center hover:bg-[#8bb3f7] z-10 ${
            showCollapseButton ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          ‹
        </button>
      )}

      {/* 사이드바 */}
      <aside 
        className={`${isCollapsed ? 'w-0 overflow-hidden' : 'w-70'} bg-white border-r border-[#e8ecf3] shadow-[4px_0_20px_rgba(0,0,0,0.04)] flex-shrink-0 relative transition-all duration-300 ${className}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* 헤더 섹션 */}
        <div className="p-8 pb-6 border-b border-[#f5f7fa] bg-[#A8C7FA] text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-base backdrop-blur-sm border border-white/10">
              S
            </div>
            <div className="text-2xl font-bold text-shadow">Speak Note</div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/15 backdrop-blur-sm border border-white/10">
            {/* 모든 사용자: 아바타 이미지 표시 */}
            <div className="w-12 h-12 bg-white rounded-full overflow-hidden shadow-lg">
              {loading ? (
                // 로딩 중: 스켈레톤 표시
                <div className="w-full h-full bg-gray-200 animate-pulse"></div>
              ) : guestAvatar ? (
                <Image
                  src={`/profile/${guestAvatar}`}
                  alt={isAuthenticated ? "사용자 아바타" : "게스트 아바타"}
                  width={60}
                  height={60}
                  className="w-full h-full object-cover"
                />
              ) : (
                // 아바타가 없을 때 기본 표시
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">?</span>
                </div>
              )}
            </div>
            <div>
              {loading ? (
                // 로딩 중: 스켈레톤 표시
                <>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-20"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                </>
              ) : (
                <>
                  <h4 className="text-base font-semibold mb-1">{user?.name || '게스트'}</h4>
                  <p className="text-sm opacity-80">{user?.email || '게스트 이메일'}</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 네비게이션 메뉴 */}
        <nav className="p-6 flex-1">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <div
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  item.isActive
                    ? 'bg-[#A8C7FA] text-white shadow-[0_4px_15px_rgba(168,199,250,0.3)]'
                    : 'hover:text-[#A8C7FA] hover:bg-[#f0f4ff] hover:translate-x-1'
                } font-medium`}
              >
                <div className="w-6 h-6 flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>
        
        {/* 하단 섹션 */}
        <div className="p-6 border-t border-[#f5f7fa] bg-[#fbfcfd]">
          <div className="space-y-2">
            <button 
              onClick={handleAuthAction}
              className="w-full p-3 bg-[#f8f9fa] text-gray-600 rounded-lg font-semibold transition-all duration-200 hover:bg-[#e8ecf3] hover:text-gray-800 text-sm border border-[#e8ecf3]"
            >
              {isAuthenticated ? '로그아웃' : '로그인'}
            </button>
          </div>
          
        </div>
      </aside>
    </>
  );
}
