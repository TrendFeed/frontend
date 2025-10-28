"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import FilterBar from "@/components/FilterBar";
import ComicCard from "@/components/ComicCard";
import ShareModal from "@/components/ShareModal";
import NewsletterModal from "@/components/NewsletterModal";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setComics } from "@/lib/redux/slices/comicsSlice";
import { openNewsletterModal } from "@/lib/redux/slices/uiSlice";
import { mockComics } from "@/lib/mockData";

// 홈 클라이언트 컴포넌트
export default function HomeClient() {
    const dispatch = useAppDispatch();
    const searchParams = useSearchParams();

    const comics = useAppSelector((state) => state.comics.comics);
    const activeTab = useAppSelector((state) => state.comics.activeTab);
    const languageFilter = useAppSelector((state) => state.comics.languageFilter);
    const sortBy = useAppSelector((state) => state.comics.sortBy);
    const searchQuery = useAppSelector((state) => state.comics.searchQuery);
    const savedComics = useAppSelector((state) => state.user.savedComics);

    // 목 데이터 로드
    useEffect(() => {
        dispatch(setComics(mockComics));
    }, [dispatch]);

    // newsletter=open → 자동 모달 오픈
    useEffect(() => {
        const newsletter = searchParams.get("newsletter");
        if (newsletter === "open") {
            dispatch(openNewsletterModal());
        }
    }, [searchParams, dispatch]);

    // 필터링 + 정렬
    const filteredComics = comics
        .filter((comic) => {
            if (activeTab === "saved" && !savedComics.includes(comic.id)) return false;
            if (languageFilter !== "all" && comic.language !== languageFilter) return false;
            if (
                searchQuery &&
                !comic.repoName.toLowerCase().includes(searchQuery.toLowerCase())
            )
                return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "stars") return b.stars - a.stars;
            if (sortBy === "recent")
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return b.likes + b.shares - (a.likes + a.shares);
        });

    return (
        <div className="min-h-screen bg-[#0D1117]">
            {/* 헤더 */}
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
            <NewsletterModal />
        </div>
    );
}
