"use client";

import { Search, Bell, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setSearchQuery } from "@/lib/redux/slices/comicsSlice";

export default function Header() {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector((state) => state.comics.searchQuery);

  return (
    <header className="sticky top-0 z-50 bg-[#0D1117] border-b border-[#30363D]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#58A6FF] to-[#3FB950] rounded-lg flex items-center justify-center font-bold text-white">
              TF
            </div>
            <h1 className="text-xl font-bold text-white hidden sm:block">
              TrendFeed
            </h1>
          </div>

          {/* Search Bar */}
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

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-[#161B22] rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#8B949E] hover:text-[#C9D1D9]" />
            </button>
            <button
              className="p-2 hover:bg-[#161B22] rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-[#8B949E] hover:text-[#C9D1D9]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
