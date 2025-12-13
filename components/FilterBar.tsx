"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setLanguageFilter,
  setSortBy,
  setCategoryFilter,
} from "@/lib/redux/slices/comicsSlice";
import { SortType, LanguageFilter } from "@/lib/types";

export default function FilterBar() {
  const dispatch = useAppDispatch();

  const {
    languageFilter,
    sortBy,
    categoryFilter,
    comics,
  } = useAppSelector((state) => state.comics);

  const languages = [
    "all",
    "TypeScript",
    "JavaScript",
    "Python",
    "Rust",
    "Go",
    "Java",
    "C++",
  ];

  // ✅ comics 컬렉션에서 category 동적 추출
  const categories = useMemo(() => {
    const set = new Set<string>();
    comics.forEach((comic) => {
      if (comic.category) set.add(comic.category);
    });
    return ["all", ...Array.from(set).sort()];
  }, [comics]);

  return (
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Language */}
        <div className="relative">
          <select
              value={languageFilter}
              onChange={(e) =>
                  dispatch(setLanguageFilter(e.target.value as LanguageFilter))
              }
              className="appearance-none bg-[#161B22] border border-[#30363D] rounded-lg pl-4 pr-10 py-2 text-sm text-[#C9D1D9] focus:outline-none focus:border-[#58A6FF]"
          >
            {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === "all" ? "All Languages" : lang}
                </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
        </div>

        {/* Category */}
        <div className="relative">
          <select
              value={categoryFilter}
              onChange={(e) =>
                  dispatch(setCategoryFilter(e.target.value))
              }
              className="appearance-none bg-[#161B22] border border-[#30363D] rounded-lg pl-4 pr-10 py-2 text-sm text-[#C9D1D9] focus:outline-none focus:border-[#58A6FF]"
          >
            {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
              value={sortBy}
              onChange={(e) =>
                  dispatch(setSortBy(e.target.value as SortType))
              }
              className="appearance-none bg-[#161B22] border border-[#30363D] rounded-lg pl-4 pr-10 py-2 text-sm text-[#C9D1D9] focus:outline-none focus:border-[#58A6FF]"
          >
            <option value="trending">Trending</option>
            <option value="stars">Most Stars</option>
            <option value="recent">Most Recent</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
        </div>
      </div>
  );
}
