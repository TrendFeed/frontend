"use client";

// 인증 컨텍스트 - 전역 인증 상태 관리
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { verifyUserSession } from "../api/user";

// 인증 컨텍스트 타입
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

// 커스텀 훅 - Auth 컨텍스트 사용
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Auth Provider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Firebase 인증 상태 변화 감지
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            await verifyUserSession();
            setUser(firebaseUser);
          } else {
            setUser(null);
          }
        } catch (err: any) {
          console.error("Auth state change error:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Auth state observer error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
