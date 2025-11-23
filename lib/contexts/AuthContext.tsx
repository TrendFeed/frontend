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
    let cancelled = false;

    // Firebase 인증 상태 변화 감지
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);
        setError(null);

        try {
          if (!firebaseUser) {
            if (!cancelled) {
              setUser(null);
            }
            return;
          }

          if (!cancelled) {
            setUser(firebaseUser);
          }

          try {
            await verifyUserSession();
          } catch (err: any) {
            if (!cancelled) {
              console.error("verifyUserSession failed:", err);
              setError(err.message);
            }
          }
        } catch (err: any) {
          if (!cancelled) {
            console.error("Auth state change error:", err);
            setError(err.message);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      },
      (err) => {
        if (!cancelled) {
          console.error("Auth state observer error:", err);
          setUser(null);
          setError(err.message);
          setLoading(false);
        }
      }
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
