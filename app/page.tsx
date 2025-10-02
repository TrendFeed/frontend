"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import FilterBar from "@/components/FilterBar";
import ComicCard from "@/components/ComicCard";
import ShareModal from "@/components/ShareModal";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setComics } from "@/lib/redux/slices/comicsSlice";
import { mockComics } from "@/lib/mockData";

export default function Home() {
  const dispatch = useAppDispatch();
  const comics = useAppSelector((state) => state.comics.comics);
  const activeTab = useAppSelector((state) => state.comics.activeTab);
  const languageFilter = useAppSelector((state) => state.comics.languageFilter);
  const sortBy = useAppSelector((state) => state.comics.sortBy);
  const searchQuery = useAppSelector((state) => state.comics.searchQuery);
  const savedComics = useAppSelector((state) => state.user.savedComics);

  useEffect(() => {
    // Load mock data
    dispatch(setComics(mockComics));
  }, [dispatch]);

  // Filter comics based on active tab, language, search, and sort
  const filteredComics = comics
    .filter((comic) => {
      // Filter by tab
      if (activeTab === "saved" && !savedComics.includes(comic.id)) {
        return false;
      }
      // Filter by language
      if (languageFilter !== "all" && comic.language !== languageFilter) {
        return false;
      }
      // Filter by search query
      if (
        searchQuery &&
        !comic.repoName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort comics
      if (sortBy === "stars") {
        return b.stars - a.stars;
      } else if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Default: trending (based on likes and shares)
      return b.likes + b.shares - (a.likes + a.shares);
    });

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <TabNavigation />
        <FilterBar />

        {filteredComics.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B949E] text-lg">
              {activeTab === "saved"
                ? "No saved comics yet. Start exploring!"
                : "No comics found matching your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        )}
      </main>

      <ShareModal />
    </div>
  );
}
