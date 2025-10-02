"use client";

import { ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setLanguageFilter,
  setSortBy,
} from "@/lib/redux/slices/comicsSlice";
import { languages } from "@/lib/mockData";
import { SortType, LanguageFilter } from "@/lib/types";

export default function FilterBar() {
  const dispatch = useAppDispatch();
  const languageFilter = useAppSelector((state) => state.comics.languageFilter);
  const sortBy = useAppSelector((state) => state.comics.sortBy);

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Language Filter */}
      <div className="relative">
        <select
          value={languageFilter}
          onChange={(e) =>
            dispatch(setLanguageFilter(e.target.value as LanguageFilter))
          }
          className="appearance-none bg-[#161B22] border border-[#30363D] rounded-lg pl-4 pr-10 py-2 text-sm text-[#C9D1D9] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF] cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang === "all" ? "All Languages" : lang}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E] pointer-events-none" />
      </div>

      {/* Sort Filter */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => dispatch(setSortBy(e.target.value as SortType))}
          className="appearance-none bg-[#161B22] border border-[#30363D] rounded-lg pl-4 pr-10 py-2 text-sm text-[#C9D1D9] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF] cursor-pointer"
        >
          <option value="trending">Trending</option>
          <option value="stars">Most Stars</option>
          <option value="recent">Most Recent</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E] pointer-events-none" />
      </div>
    </div>
  );
}
