// 회원가입 페이지
import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign Up - TrendFeed",
  description: "Create a new TrendFeed account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4 py-12">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#58A6FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3FB950]/10 rounded-full blur-3xl" />
      </div>

      {/* 회원가입 폼 */}
      <div className="relative z-10">
        <SignupForm />
      </div>
    </div>
  );
}
