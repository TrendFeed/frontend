"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, X, Loader2, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

// 뉴스레터 구독 확인 페이지
export default function NewsletterConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 토큰이 없으면 에러 처리
    if (!token) {
      setStatus("error");
      setMessage("Invalid confirmation link. Please check your email and try again.");
      return;
    }

    // 구독 확인 API 호출
    const confirmSubscription = async () => {
      try {
        // TODO: 백엔드 API 연동
        // const response = await fetch(`/api/newsletter/confirm?token=${token}`, {
        //   method: 'GET',
        // });
        // const data = await response.json();
        //
        // if (!response.ok) {
        //   throw new Error(data.message || 'Confirmation failed');
        // }

        // 임시로 성공 처리 (나중에 실제 API 연동)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStatus("success");
        setMessage(
          "Your subscription is confirmed! You'll start receiving weekly updates."
        );
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.message || "Failed to confirm subscription. Please try again or contact support."
        );
      }
    };

    confirmSubscription();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4 py-12">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#58A6FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3FB950]/10 rounded-full blur-3xl" />
      </div>

      {/* 메인 카드 */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl p-8">
          {/* 로딩 상태 */}
          {status === "loading" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#58A6FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-[#58A6FF] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">
                Confirming your subscription...
              </h1>
              <p className="text-[#8B949E]">
                Please wait while we verify your email.
              </p>
            </div>
          )}

          {/* 성공 상태 */}
          {status === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3FB950]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#3FB950]" />
              </div>
              <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">
                Subscription Confirmed!
              </h1>
              <p className="text-[#8B949E] mb-6">{message}</p>

              {/* 구독 정보 */}
              <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="w-5 h-5 text-[#58A6FF] mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#C9D1D9] mb-1">
                      What's next?
                    </h3>
                    <p className="text-sm text-[#8B949E]">
                      You'll receive your first newsletter this Monday at 10:00 AM with:
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-sm text-[#8B949E]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-1.5 flex-shrink-0" />
                    <span>3-5 trending GitHub repositories</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#8B949E]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-1.5 flex-shrink-0" />
                    <span>AI-powered summaries in comic format</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#8B949E]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-1.5 flex-shrink-0" />
                    <span>Direct links to explore more</span>
                  </li>
                </ul>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full bg-[#58A6FF] hover:bg-[#4A96E6] hover:cursor-pointer text-white font-medium py-3 rounded-lg transition-colors text-center"
                >
                  Explore Comics Now
                </Link>
                <button
                  onClick={() => router.back()}
                  className="w-full bg-[#161B22] hover:bg-[#1C2128] hover:cursor-pointer border border-[#30363D] text-[#C9D1D9] font-medium py-3 rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {status === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">
                Confirmation Failed
              </h1>
              <p className="text-[#8B949E] mb-6">{message}</p>

              {/* 에러 원인 안내 */}
              <div className="bg-[#0D1117] border border-red-500/30 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-[#C9D1D9] mb-2">
                  Possible reasons:
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#8B949E]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <span>The confirmation link has expired</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#8B949E]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <span>The link has already been used</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#8B949E]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <span>Invalid or corrupted link</span>
                  </li>
                </ul>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full bg-[#58A6FF] hover:bg-[#4A96E6] hover:cursor-pointer text-white font-medium py-3 rounded-lg transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Home</span>
                  </div>
                </Link>
                <button
                  onClick={() => router.push("/")}
                  className="w-full bg-[#161B22] hover:bg-[#1C2128] hover:cursor-pointer border border-[#30363D] text-[#C9D1D9] font-medium py-3 rounded-lg transition-colors"
                >
                  Try Subscribing Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="text-center mt-6">
          <p className="text-xs text-[#8B949E]">
            Having trouble?{" "}
            <a
              href="mailto:support@trendfeed.com"
              className="text-[#58A6FF] hover:underline hover:cursor-pointer"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
