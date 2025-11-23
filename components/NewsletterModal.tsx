"use client";

import { X, Mail, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { closeNewsletterModal } from "@/lib/redux/slices/uiSlice";
import {
  subscribeToNewsletter,
  unsubscribeNewsletter,
} from "@/lib/api/newsletter";

// 뉴스레터 구독 모달 컴포넌트
export default function NewsletterModal() {
  const dispatch = useAppDispatch();
  const newsletterModalOpen = useAppSelector(
    (state) => state.ui.newsletterModalOpen
  );

  const [email, setEmail] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "idle" | "success" | "error" | "subscribed"
  >("idle");
  const [message, setMessage] = useState("");

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!newsletterModalOpen) return null;

  // 이메일 유효성 검사
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 구독 신청 핸들러
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!email || !isValidEmail(email)) {
      setSubscriptionStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!agreedToPrivacy) {
      setSubscriptionStatus("error");
      setMessage("Please agree to the privacy policy.");
      return;
    }

    setLoading(true);
    setSubscriptionStatus("idle");

    try {
      const response = await subscribeToNewsletter(email);

      if (response.status === "active") {
        setMessage("You're already subscribed and confirmed!");
        setSubscriptionStatus("subscribed");
      } else {
        setSubscriptionStatus("success");
        setMessage(
          "Check your email! We've sent you a confirmation link to complete your subscription."
        );
      }
      setEmail("");
      setAgreedToPrivacy(false);
    } catch (err: any) {
      setSubscriptionStatus("error");
      console.log('error')
      console.log(err.message)
      setMessage(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 구독 해지 핸들러
  const handleUnsubscribe = async () => {
    if (!email || !isValidEmail(email)) {
      setSubscriptionStatus("error");
      setMessage("Enter the email you used to subscribe.");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? window.prompt("Enter the unsubscribe token from your email")
        : null;

    if (!token) {
      setSubscriptionStatus("error");
      setMessage("Unsubscribe token is required.");
      return;
    }

    setLoading(true);

    try {
      await unsubscribeNewsletter(email, token);
      setSubscriptionStatus("idle");
      setMessage("You have been unsubscribed successfully.");
      setEmail("");
      setAgreedToPrivacy(false);
    } catch (err: any) {
      setSubscriptionStatus("error");
      setMessage(err.message || "Failed to unsubscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기 함수
  const handleClose = () => {
    dispatch(closeNewsletterModal());
    // 상태 초기화
    setTimeout(() => {
      setEmail("");
      setAgreedToPrivacy(false);
      setSubscriptionStatus("idle");
      setMessage("");
    }, 300);
  };

  return (
    <>
      {/* 배경 오버레이 (클릭 시 모달 닫기) */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* 모달 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-[#30363D]">
            <div>
              <h2 className="text-2xl font-bold text-[#C9D1D9] mb-1">
                📩 TrendFeed Weekly Digest
              </h2>
              <p className="text-sm text-[#8B949E]">
                Get the latest open-source trends in comic format
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-[#0D1117] hover:cursor-pointer rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#8B949E]" />
            </button>
          </div>

          {/* 모달 내용 */}
          <div className="p-6">
            {/* 설명 섹션 */}
            <div className="mb-6 bg-[#0D1117] border border-[#30363D] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#C9D1D9] mb-2">
                What you&apos;ll receive:
              </h3>
              <ul className="space-y-2 text-sm text-[#8B949E]">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-1.5 flex-shrink-0" />
                  <span>
                    Weekly digest of 3-5 trending GitHub repositories
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-1.5 flex-shrink-0" />
                  <span>AI-powered summaries in comic format</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-1.5 flex-shrink-0" />
                  <span>
                    Direct links to explore repositories and full comics
                  </span>
                </li>
              </ul>
            </div>

            {/* 구독 상태 메시지 */}
            {message && (
              <div
                className={`mb-4 rounded-lg p-4 ${
                  subscriptionStatus === "success"
                    ? "bg-[#3FB950]/10 border border-[#3FB950]/50"
                    : subscriptionStatus === "error"
                    ? "bg-red-500/10 border border-red-500/50"
                    : "bg-[#58A6FF]/10 border border-[#58A6FF]/50"
                }`}
              >
                <p
                  className={`text-sm ${
                    subscriptionStatus === "success"
                      ? "text-[#3FB950]"
                      : subscriptionStatus === "error"
                      ? "text-red-500"
                      : "text-[#58A6FF]"
                  }`}
                >
                  {message}
                </p>
              </div>
            )}

            {/* 구독 폼 */}
            {subscriptionStatus !== "success" && (
              <form onSubmit={handleSubscribe} className="space-y-4">
                {/* 이메일 입력 */}
                <div>
                  <label className="block text-sm font-medium text-[#C9D1D9] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B949E]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg pl-10 pr-4 py-3 text-[#C9D1D9] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
                    />
                  </div>
                </div>

                {/* 개인정보 동의 체크박스 */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacy-agreement"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-[#30363D] bg-[#0D1117] text-[#58A6FF] focus:ring-[#58A6FF] focus:ring-offset-0 hover:cursor-pointer"
                  />
                  <label
                    htmlFor="privacy-agreement"
                    className="text-sm text-[#8B949E] hover:cursor-pointer"
                  >
                    I agree to receive weekly newsletters and understand that I
                    can unsubscribe at any time. By subscribing, you agree to
                    our privacy policy.
                  </label>
                </div>

                {/* 구독 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#58A6FF] hover:bg-[#4A96E6] hover:cursor-pointer text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Subscribe to Newsletter
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 구독 성공 후 표시 */}
            {subscriptionStatus === "success" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#3FB950]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#3FB950]" />
                </div>
                <h3 className="text-lg font-semibold text-[#C9D1D9] mb-2">
                  Almost there!
                </h3>
                <p className="text-sm text-[#8B949E] mb-6">
                  Please check your email and click the confirmation link to
                  complete your subscription.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-[#161B22] hover:bg-[#1C2128] hover:cursor-pointer border border-[#30363D] text-[#C9D1D9] px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            )}

            {/* 구독 해지 링크 */}
            {email && subscriptionStatus !== "success" && (
              <div className="mt-6 pt-6 border-t border-[#30363D]">
                <p className="text-sm text-[#8B949E] text-center mb-3">
                  Already subscribed? Enter your email and use the unsubscribe
                  token from your inbox.
                </p>
                <button
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 hover:cursor-pointer border border-red-500/50 text-red-500 font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Unsubscribing..." : "Unsubscribe"}
                </button>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="px-6 py-4 bg-[#0D1117] border-t border-[#30363D] rounded-b-lg">
            <p className="text-xs text-[#8B949E] text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
