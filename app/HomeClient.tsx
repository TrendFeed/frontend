"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import FilterBar from "@/components/FilterBar";
import ComicCard from "@/components/ComicCard";
import ShareModal from "@/components/ShareModal";
import NewsletterModal from "@/components/NewsletterModal";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setComics,
  setLoading as setComicsLoading,
  setPagination,
  setError as setComicsError,
} from "@/lib/redux/slices/comicsSlice";
import { openNewsletterModal } from "@/lib/redux/slices/uiSlice";
import {
  fetchComics,
  fetchComicsByLanguage,
} from "@/lib/api/comics";
import { getSavedComics } from "@/lib/api/user";
import { useAuth } from "@/lib/contexts/AuthContext";

// 홈 클라이언트 컴포넌트
export default function HomeClient() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const comics = useAppSelector((state) => state.comics.comics);
  const activeTab = useAppSelector((state) => state.comics.activeTab);
  const languageFilter = useAppSelector((state) => state.comics.languageFilter);
  const sortBy = useAppSelector((state) => state.comics.sortBy);
  const searchQuery = useAppSelector((state) => state.comics.searchQuery);
  const savedComics = useAppSelector((state) => state.user.savedComics);
  const loading = useAppSelector((state) => state.comics.loading);
  const error = useAppSelector((state) => state.comics.error);

  useEffect(() => {
    const controller = new AbortController();

    const loadComics = async () => {
      dispatch(setComicsLoading(true));
      dispatch(setComicsError(null));

      const mapSort = () => {
        if (activeTab === "forYou") return "latest";
        if (sortBy === "stars") return "stars";
        if (sortBy === "recent") return "latest";
        return "likes";
      };

      try {
        let result;

        if (activeTab === "saved") {
          if (!user) {
            dispatch(setComics([]));
            dispatch(setPagination(null));
            dispatch(setComicsLoading(false));
            return;
          }
          result = await getSavedComics({
            page: 1,
            limit: 50,
            signal: controller.signal,
          });
        } else if (languageFilter !== "all") {
          result = await fetchComicsByLanguage(languageFilter, {
            page: 1,
            limit: 20,
            signal: controller.signal,
          });
        } else {
          result = await fetchComics({
            page: 1,
            limit: 20,
            sortBy: mapSort(),
            signal: controller.signal,
          });
        }

        dispatch(setComics(result.data));
        dispatch(setPagination(result.pagination));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to load comics:", err);
        dispatch(
          setComicsError(err?.message || "Failed to load comics from server.")
        );
      } finally {
        dispatch(setComicsLoading(false));
      }
    };

    void loadComics();

    return () => controller.abort();
  }, [dispatch, activeTab, languageFilter, sortBy, user]);

  // newsletter=open → 자동 모달 오픈
  useEffect(() => {
    const newsletter = searchParams.get("newsletter");
    if (newsletter === "open") {
      dispatch(openNewsletterModal());
    }
  }, [searchParams, dispatch]);

  const filteredComics = useMemo(() => {
    const matches = comics.filter((comic) => {
      if (
        activeTab === "saved" &&
        savedComics.length > 0 &&
        !savedComics.includes(comic.id)
      ) {
        return false;
      }
      if (languageFilter !== "all" && comic.language !== languageFilter) {
        return false;
      }
      if (
        searchQuery &&
        !comic.repoName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...matches].sort((a, b) => {
      if (sortBy === "stars") return b.stars - a.stars;
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.likes + b.shares - (a.likes + a.shares);
    });

    if (activeTab === "forYou") {
      const newComics = sorted.filter((comic) => comic.isNew);
      if (newComics.length > 0) {
        const rest = sorted.filter((comic) => !comic.isNew);
        return [...newComics, ...rest];
      }
    }

    return sorted;
  }, [
    comics,
    activeTab,
    savedComics,
    languageFilter,
    searchQuery,
    sortBy,
  ]);

  const renderEmptyState = () => (
    <div className="text-center py-20">
      <p className="text-[#8B949E] text-lg">
        {activeTab === "saved" && !user
          ? "Log in to view your saved comics."
          : activeTab === "saved"
          ? "No saved comics yet. Start exploring!"
          : "No comics found matching your filters."}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <TabNavigation />
        <FilterBar />

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-[#8B949E]">Loading comics...</div>
        ) : filteredComics.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredComics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        )}
      </main>

      <ShareModal />
      <NewsletterModal />
    </div>
  );
}
