"use client";

// 로그인 폼 컴포넌트
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Github, Loader2 } from "lucide-react";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithGitHub,
} from "@/lib/firebase/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 이메일 로그인 핸들러
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      router.push("/"); // 로그인 성공 시 홈으로 이동
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인 핸들러
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Google 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // GitHub 로그인 핸들러
  const handleGitHubLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGitHub();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "GitHub 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#C9D1D9] mb-2">Welcome Back</h1>
        <p className="text-[#8B949E]">Sign in to continue to TrendFeed</p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* 이메일 로그인 폼 */}
      <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
        {/* 이메일 입력 */}
        <div>
          <label className="block text-sm font-medium text-[#C9D1D9] mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B949E]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-[#161B22] border border-[#30363D] rounded-lg pl-10 pr-4 py-3 text-[#C9D1D9] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
            />
          </div>
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label className="block text-sm font-medium text-[#C9D1D9] mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B949E]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#161B22] border border-[#30363D] rounded-lg pl-10 pr-4 py-3 text-[#C9D1D9] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
            />
          </div>
        </div>

        {/* 비밀번호 찾기 링크 */}
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-[#58A6FF] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#58A6FF] hover:bg-[#4A96E6] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* 구분선 */}
      <div className="flex items-center w-full my-6">
        <div className="flex-1 border-t border-[#30363D]"></div>
        <span className="px-4 text-sm text-[#8B949E]">
    Or continue with
  </span>
        <div className="flex-1 border-t border-[#30363D]"></div>
      </div>

      {/* 소셜 로그인 버튼들 */}
      <div className="flex flex-row gap-4">
        {/* Google 로그인 */}
        <button
            onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </button>

        {/* GitHub 로그인 */}
        <button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full bg-[#161B22] hover:bg-[#1C2128] border border-[#30363D] text-[#C9D1D9] font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Github className="w-5 h-5" />
        </button>
      </div>

      {/* 회원가입 링크 */}
      <div className="text-center">
        <p className="text-[#8B949E]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#58A6FF] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
