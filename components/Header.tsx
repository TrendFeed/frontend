"use client";

import { Search, Bell, Settings, Mail } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setSearchQuery } from "@/lib/redux/slices/comicsSlice";
import { openNewsletterModal } from "@/lib/redux/slices/uiSlice";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/contexts/AuthContext";
// 헤더 컴포넌트 - 로고, 검색바, 액션 버튼 포함
export default function Header() {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector((state) => state.comics.searchQuery);
  const userProfile = useAppSelector((state) => state.user.profile);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const router = useRouter();
  const { user } = useAuth();

  const profileImage = userProfile?.photoURL || user?.photoURL || null;
  const profileInitial =
    userProfile?.displayName?.charAt(0) ||
    userProfile?.email?.charAt(0) ||
    user?.displayName?.charAt(0) ||
    user?.email?.charAt(0) ||
    "?";
  const isLoggedIn = Boolean(isAuthenticated || userProfile || user);

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleNewsletter = () => {
    dispatch(openNewsletterModal());
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0D1117] border-b border-[#30363D]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* 로고 */}
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white hidden sm:block">
              TrendFeed
            </h1>
          </div>

          {/* 검색바 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full bg-[#161B22] border border-[#30363D] rounded-lg pl-10 pr-4 py-2 text-sm text-[#C9D1D9] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
              />
            </div>
          </div>

          {/* 액션 버튼 (뉴스레터, 알림, 설정) */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-[#161B22] hover:cursor-pointer rounded-lg transition-colors"
              aria-label="Newsletter"
              onClick={handleNewsletter}
            >
              <Mail className="w-5 h-5 text-[#8B949E] hover:text-[#C9D1D9]" />
            </button>
            <button
              className="p-2 hover:bg-[#161B22] hover:curson
              r-pointer rounded-lg transition-colors"
              aria-label="Notifications"
              onClick={handleNotifications}
            >
              <Bell className="w-5 h-5 text-[#8B949E] hover:text-[#C9D1D9]" />
            </button>
            {isLoggedIn ? (
              <button
                className="p-0 w-10 h-10 rounded-full overflow-hidden border border-[#30363D] hover:border-[#58A6FF] transition-colors"
                aria-label="Profile"
                onClick={handleSettings}
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile avatar"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[#161B22] text-sm font-semibold text-[#C9D1D9]">
                    {profileInitial}
                  </span>
                )}
              </button>
            ) : (
              <button
                className="p-2 hover:bg-[#161B22] hover:cursor-pointer rounded-lg transition-colors"
                aria-label="Settings"
                onClick={handleSettings}
              >
                <Settings className="w-5 h-5 text-[#8B949E] hover:text-[#C9D1D9]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
