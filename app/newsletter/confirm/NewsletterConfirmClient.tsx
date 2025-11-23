"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, X, Loader2, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { confirmNewsletterSubscription } from "@/lib/api/newsletter";

export default function NewsletterConfirmClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid confirmation link. Please check your email and try again.");
            return;
        }

        const confirmSubscription = async () => {
            try {
                const response = await confirmNewsletterSubscription(token);
                setStatus("success");
                setMessage(
                    response.message ||
                        (response.status === "active"
                            ? "Your subscription is confirmed! You'll start receiving weekly updates."
                            : "Confirmation received. Please check your inbox for next steps.")
                );
            } catch (err: any) {
                setStatus("error");
                console.log(err)
                setMessage(err.message || "Failed to confirm subscription. Please try again or contact support.");
            }
        };

        confirmSubscription();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4 py-12">
            {/* 배경 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#58A6FF]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3FB950]/10 rounded-full blur-3xl" />
            </div>

            {/* 메인 카드 */}
            <div className="relative z-10 max-w-md w-full">
                <div className="bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl p-8">
                    {/* 로딩 */}
                    {status === "loading" && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#58A6FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Loader2 className="w-8 h-8 text-[#58A6FF] animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">
                                Confirming your subscription...
                            </h1>
                            <p className="text-[#8B949E]">Please wait while we verify your email.</p>
                        </div>
                    )}

                    {/* 성공 */}
                    {status === "success" && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#3FB950]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-[#3FB950]" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">
                                Subscription Confirmed!
                            </h1>
                            <p className="text-[#8B949E] mb-6">{message}</p>

                            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 mb-6 text-left">
                                <div className="flex items-start gap-3 mb-3">
                                    <Mail className="w-5 h-5 text-[#58A6FF] mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#C9D1D9] mb-1">What&apos;s next?</h3>
                                        <p className="text-sm text-[#8B949E]">
                                            You&apos;ll receive your first newsletter this Monday at 10:00 AM with:
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

                            <div className="space-y-3">
                                <Link
                                    href="/"
                                    className="block w-full bg-[#58A6FF] hover:bg-[#4A96E6] text-white font-medium py-3 rounded-lg transition-colors text-center"
                                >
                                    Explore Comics Now
                                </Link>
                                <button
                                    onClick={() => router.back()}
                                    className="w-full bg-[#161B22] hover:bg-[#1C2128] border border-[#30363D] text-[#C9D1D9] font-medium py-3 rounded-lg transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 실패 */}
                    {status === "error" && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">
                                Confirmation Failed
                            </h1>
                            <p className="text-[#8B949E] mb-6">{message}</p>

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

                            <div className="space-y-3">
                                <Link
                                    href="/"
                                    className="block w-full bg-[#58A6FF] hover:bg-[#4A96E6] text-white font-medium py-3 rounded-lg transition-colors text-center"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <ArrowLeft className="w-5 h-5" />
                                        <span>Back to Home</span>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => router.push("/")}
                                    className="w-full bg-[#161B22] hover:bg-[#1C2128] border border-[#30363D] text-[#C9D1D9] font-medium py-3 rounded-lg transition-colors"
                                >
                                    Try Subscribing Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
