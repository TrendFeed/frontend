"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import FilterBar from "@/components/FilterBar";
import ComicCard from "@/components/ComicCard";
import ShareModal from "@/components/ShareModal";
import NewsletterModal from "@/components/NewsletterModal";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setComics } from "@/lib/redux/slices/comicsSlice";
import { mockComics } from "@/lib/mockData";

// 메인 홈 페이지 컴포넌트
export default function Home() {
  const dispatch = useAppDispatch();
  // Redux 스토어에서 상태 가져오기
  const comics = useAppSelector((state) => state.comics.comics);
  const activeTab = useAppSelector((state) => state.comics.activeTab);
  const languageFilter = useAppSelector((state) => state.comics.languageFilter);
  const sortBy = useAppSelector((state) => state.comics.sortBy);
  const searchQuery = useAppSelector((state) => state.comics.searchQuery);
  const savedComics = useAppSelector((state) => state.user.savedComics);

  // 컴포넌트 마운트 시 목 데이터 로드
  useEffect(() => {
    dispatch(setComics(mockComics));
  }, [dispatch]);

  // 활성 탭, 언어, 검색어, 정렬 기준에 따라 코믹 필터링
  const filteredComics = comics
    .filter((comic) => {
      // 탭별 필터링
      if (activeTab === "saved" && !savedComics.includes(comic.id)) {
        return false;
      }
      // 언어별 필터링
      if (languageFilter !== "all" && comic.language !== languageFilter) {
        return false;
      }
      // 검색어로 필터링
      if (
        searchQuery &&
        !comic.repoName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // 코믹 정렬
      if (sortBy === "stars") {
        return b.stars - a.stars; // 별점순
      } else if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // 최신순
      }
      // 기본: 트렌딩순 (좋아요 + 공유 수 기준)
      return b.likes + b.shares - (a.likes + a.shares);
    });

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* 헤더 컴포넌트 */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 탭 네비게이션 */}
        <TabNavigation />
        {/* 필터 바 (언어 및 정렬 옵션) */}
        <FilterBar />

        {/* 필터링된 코믹이 없을 때 빈 상태 메시지 표시 */}
        {filteredComics.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B949E] text-lg">
              {activeTab === "saved"
                ? "No saved comics yet. Start exploring!"
                : "No comics found matching your filters."}
            </p>
          </div>
        ) : (
          // 코믹 카드 그리드 레이아웃
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        )}
      </main>

      {/* 공유 모달 */}
      <ShareModal />

      {/* 뉴스레터 모달 */}
      <NewsletterModal />
    </div>
  );
}
