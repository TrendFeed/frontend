"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setActiveTab } from "@/lib/redux/slices/comicsSlice";
import { TabType } from "@/lib/types";

// 탭 네비게이션 컴포넌트 - For You, Trending, Saved 탭 전환
export default function TabNavigation() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.comics.activeTab);

  // 탭 목록 정의
  const tabs: { id: TabType; label: string }[] = [
    { id: "forYou", label: "For You" },
    { id: "trending", label: "Trending" },
    { id: "saved", label: "Saved" },
  ];

  return (
    <div className="flex items-center gap-1 mb-6 border-b border-[#30363D]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => dispatch(setActiveTab(tab.id))}
          className={`px-4 py-3 text-sm font-medium transition-colors relative hover:cursor-pointer ${
            activeTab === tab.id
              ? "text-[#58A6FF]"
              : "text-[#8B949E] hover:text-[#C9D1D9]"
          }`}
        >
          {tab.label}
          {/* 활성 탭 하단 표시 바 */}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#58A6FF]" />
          )}
        </button>
      ))}
    </div>
  );
}
