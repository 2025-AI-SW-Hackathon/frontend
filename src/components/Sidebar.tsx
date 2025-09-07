"use client";

import { useState, useEffect } from "react";
import { Folder, FolderOpen, ChevronDown, ChevronRight, Plus } from "lucide-react";
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
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, isAuthenticated, loading, setUserFromTokens } = useAuth();

  // 프로필 이미지 설정
  useEffect(() => {
    // 로딩 중이면 프로필 설정하지 않음
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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const lectureFolders = [
    {
      id: "database",
      name: "데이터베이스",
      lectures: [
        { id: "db1", name: "관계형 DB 설계", status: "완료" },
        { id: "db2", name: "SQL 최적화", status: "진행중" },
      ],
    },
    {
      id: "ai-ml",
      name: "AI/머신러닝",
      lectures: [
        { id: "ml1", name: "딥러닝 기초", status: "완료" },
        { id: "ml2", name: "자연어 처리", status: "완료" },
        { id: "ml3", name: "컴퓨터 비전", status: "예정" },
      ],
    },
    {
      id: "web-dev",
      name: "웹 개발",
      lectures: [
        { id: "web1", name: "React 심화", status: "완료" },
        { id: "web2", name: "Node.js API", status: "진행중" },
      ],
    },
  ];

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
      isActive: pathname === '/dashboard'
    },
    {
      path: '/home',
      label: '강의 사용',
      isActive: pathname === '/home'
    },
    {
      path: '/settings',
      label: '설정',
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
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-12 bg-[#2A3441] text-white rounded-r-lg shadow-lg transition-all duration-300 flex items-center justify-center hover:bg-[#3A4551] ${
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
          className={`absolute top-1/2 left-[280px] transform -translate-y-1/2 w-8 h-12 bg-[#2A3441] text-white rounded-l-lg shadow-lg transition-all duration-300 flex items-center justify-center hover:bg-[#3A4551] z-10 ${
            showCollapseButton ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          ‹
        </button>
      )}

      {/* 사이드바 */}
      <aside 
        className={`${isCollapsed ? 'w-0 overflow-hidden' : 'w-70'} bg-[#1D283C] border-r border-[#2A3441] shadow-[4px_0_20px_rgba(0,0,0,0.1)] flex-shrink-0 relative transition-all duration-300 ${className}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* 헤더 섹션 */}
        <div className="p-8 pb-6 border-b border-[#2A3441] bg-[#1D283C] text-white">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-lg font-bold text-white">Speak Note</span>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#2A3441] backdrop-blur-sm border border-[#3A4551]">
            {/* 모든 사용자: 프로필 이미지 표시 */}
            <div className="w-12 h-12 bg-white rounded-full overflow-hidden shadow-lg">
              {loading ? (
                // 로딩 중: 스켈레톤 표시
                <div className="w-full h-full bg-gray-200 animate-pulse"></div>
              ) : guestAvatar ? (
                <Image
                  src={`/profile/${guestAvatar}`}
                  alt={isAuthenticated ? "사용자 프로필" : "게스트 프로필"}
                  width={60}
                  height={60}
                  className="w-full h-full object-cover"
                />
              ) : (
                // 프로필이 없을 때 기본 표시
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
        <nav className="p-4 flex-1">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-all duration-300 rounded-lg ${
                  item.isActive
                    ? 'bg-[#2A3441] text-white'
                    : 'text-white hover:bg-[#2A3441]'
                }`}
              >
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* 강의 폴더 섹션 */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">강의 폴더</span>
              <button className="p-1 text-gray-400 hover:text-white hover:bg-[#2A3441] rounded">
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1">
              {lectureFolders.map((folder) => {
                const isExpanded = expandedFolders.includes(folder.id);
                return (
                  <div key={folder.id}>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[#2A3441] rounded-lg group"
                    >
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="flex-1 text-left">{folder.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {folder.lectures.map((lecture) => (
                          <div
                            key={lecture.id}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-[#2A3441] rounded cursor-pointer"
                          >
                            <span
                              className={`w-2 h-2 rounded-full inline-block ${
                                lecture.status === '완료'
                                  ? 'bg-green-400'
                                  : lecture.status === '진행중'
                                    ? 'bg-blue-400'
                                    : 'bg-gray-400'
                              }`}
                            />
                            <span className="flex-1">{lecture.name}</span>
                            <span className="text-gray-500">{lecture.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 사용 시간 위젯 */}
          <div className="mt-6 p-3 bg-[#2A3441] rounded-lg border border-[#3A4551]">
            <div className="flex items-center gap-2 text-sm text-white">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>480분 사용 / 600분</span>
            </div>
          </div>
        </nav>
        
        {/* 하단 섹션 */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="space-y-2">
            <button 
              onClick={handleAuthAction}
              className="w-full justify-start text-white hover:text-white hover:bg-[#2A3441] px-3 py-2 text-sm rounded-lg transition-all duration-200"
            >
              {isAuthenticated ? '로그아웃' : '로그인'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
