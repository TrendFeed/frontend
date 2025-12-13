"use client";

import React, { useEffect, useMemo } from "react";
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

// 👇 [추가됨] Firestore 직접 접근 및 추천 함수 임포트
import { db } from "@/lib/firebase/config"; // path 확인 필요 (예: "@/firebase/config")
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { getRecommendedCategories } from "@/lib/recommend"
import {Comic} from "@/lib/types";
import AdvertisingButton from "@/components/AdvertisingButton";

// 홈 클라이언트 컴포넌트
export default function HomeClient() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const categoryFilter = useAppSelector(
      (state) => state.comics.categoryFilter
  );
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
        }
        // 👇 [수정됨] For You 탭 로직: 추천 카테고리 기반 직접 쿼리
        else if (activeTab === "forYou") {
          if (!user) {
            // 비로그인 상태면 기본(최신순) fetch
            result = await fetchComics({
              page: 1,
              limit: 20,
              sortBy: "latest",
              signal: controller.signal,
            });
          } else {
            // 1. 추천 카테고리 가져오기
            const ranked = await getRecommendedCategories(user.uid);

            // 2. 상위 5개 추출 (Firestore 'in' 쿼리 제한 고려)
            const topCategories = ranked.slice(0, 5).map(r  => r.category);

            if (topCategories.length === 0) {
              // 추천 데이터가 없으면 기본 fetch
              result = await fetchComics({
                page: 1,
                limit: 20,
                sortBy: "latest",
                signal: controller.signal,
              });
            } else {
              // 3. Firestore 직접 쿼리 (category IN [...])
              const comicsRef = collection(db, "comics");
              const q = query(
                  comicsRef,
                  where("category", "in", topCategories),
                  limit(20)
              );

              const snapshot = await getDocs(q);

              // 4. 데이터 매핑 (Redux state 형태에 맞춤)
              const fetchedComics = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  ...data, // repoName, stars 등 나머지 데이터

                  // ✨ [수정 1] Interface가 id: number이므로 문자열 ID를 숫자로 변환
                  id: Number(doc.id),

                  // Timestamp 처리
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                  // (Interface에 updatedAt이 없다면 생략 가능하지만, 안전하게 두어도 무방)

                } as unknown as Comic; // ✨ [수정 2] 'unknown'으로 먼저 변환하여 강제 캐스팅
              });

              // 5. 클라이언트 측 정렬 (최신순)
              // 복합 인덱스 없이 'in' 필터와 정렬을 동시에 하기 위해 JS로 정렬
              fetchedComics.sort((a: any, b: any) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );

              console.log(`[ForYou] Filtered by: ${topCategories.join(", ")}`);

              result = {
                data: fetchedComics,
                pagination: null // 커스텀 쿼리라 페이지네이션 정보 없음
              };
            }
          }
        }
        else if (languageFilter !== "all") {
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

        // 결과 Dispatch
        // result가 undefined일 수 있는 경우(에러 등) 방지
        if (result && result.data) {
          dispatch(setComics(result.data));
          dispatch(setPagination(result.pagination || null)); // pagination이 없으면 null
        }

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

      // ✅ category 필터 추가
      if (categoryFilter !== "all" && comic.category !== categoryFilter) {
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
        return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
      }
      return b.likes + b.shares - (a.likes + a.shares);
    });

    return sorted;
  }, [
    comics,
    activeTab,
    savedComics,
    languageFilter,
    categoryFilter, // ✅ dependency 추가
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
        <AdvertisingButton />
      </div>
  );
}