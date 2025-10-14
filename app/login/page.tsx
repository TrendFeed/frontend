// 로그인 페이지
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
    title: "Login - TrendFeed",
    description: "Sign in to your TrendFeed account",
};

export default function LoginPage() {
    return (
        <div className="relative min-h-screen bg-[#0D1117] flex items-center justify-center px-4 py-12">
            {/* 왼쪽 상단 Back 버튼 */}
            <Link
                href="/"
                className="absolute top-6 left-6 flex items-center text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back</span>
            </Link>

            {/* 배경 그라데이션 효과 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#58A6FF]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3FB950]/10 rounded-full blur-3xl" />
            </div>

            {/* 로그인 폼 */}
            <div className="relative z-10">
                <LoginForm />
            </div>
        </div>
    );
}
