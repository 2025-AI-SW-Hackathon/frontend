"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/auth";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const checkAuth = () => {
      if (auth.isLoggedIn()) {
        // 실제로는 백엔드에서 사용자 정보를 가져와야 함
        // 여기서는 임시로 로컬 스토리지 정보 사용
        const userId = auth.getUserId();
        if (userId) {
          setUser({
            id: userId,
            email: "user@example.com", // 실제로는 백엔드에서 가져와야 함
            name: "사용자", // 실제로는 백엔드에서 가져와야 함
          });
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignIn = () => {
    // Google OAuth 시작
    const { googleAuth } = require('@/lib/auth');
    googleAuth.startLogin();
  };

  const handleSignOut = () => {
    auth.logout();
    setUser(null);
    window.location.href = "/";
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 