"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { logOut } from "@/lib/firebase/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-[#8B949E]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="sticky top-0 z-50 bg-[#0D1117] border-b border-[#30363D]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8B949E] hover:text-[#C9D1D9] hover:cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#C9D1D9] mb-8">Settings</h1>

        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#C9D1D9] mb-6">
            Profile Information
          </h2>

          <div className="flex items-center gap-6 mb-6">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-20 h-20 rounded-full border-2 border-[#30363D]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#58A6FF] to-[#3FB950] flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-[#C9D1D9]">
                {user.displayName || "Anonymous"}
              </h3>
              <p className="text-sm text-[#8B949E]">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8B949E] mb-2">
                Name
              </label>
              <div className="flex items-center gap-3 bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3">
                <User className="w-5 h-5 text-[#8B949E]" />
                <span className="text-[#C9D1D9]">
                  {user.displayName || "Not set"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8B949E] mb-2">
                Email
              </label>
              <div className="flex items-center gap-3 bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3">
                <Mail className="w-5 h-5 text-[#8B949E]" />
                <span className="text-[#C9D1D9]">{user.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8B949E] mb-2">
                User ID
              </label>
              <div className="bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3">
                <code className="text-xs text-[#C9D1D9] break-all">
                  {user.uid}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#C9D1D9] mb-6">
            Account Actions
          </h2>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full bg-red-500/10 hover:bg-red-500/20 hover:cursor-pointer border border-red-500/50 text-red-500 font-medium px-4 py-3 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#8B949E]">
            Connected via{" "}
            {user.providerData[0]?.providerId === "google.com"
              ? "Google"
              : user.providerData[0]?.providerId === "github.com"
              ? "GitHub"
              : "Email"}
          </p>
        </div>
      </main>
    </div>
  );
}
