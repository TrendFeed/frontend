"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share2, ExternalLink, Download, Bookmark, Mail } from "lucide-react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleSavedComic } from "@/lib/redux/slices/userSlice";
import { openShareModal, openNewsletterModal } from "@/lib/redux/slices/uiSlice";
import { mockComics } from "@/lib/mockData";
import ComicCard from "@/components/ComicCard";
import ShareModal from "@/components/ShareModal";
import NewsletterModal from "@/components/NewsletterModal";
import { Star } from "lucide-react";

// 코믹 상세 페이지 컴포넌트
export default function ComicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const savedComics = useAppSelector((state) => state.user.savedComics);

  // URL 파라미터로 해당 코믹 찾기
  const comic = mockComics.find((c) => c.id === params.id);
  // 같은 언어의 관련 코믹 3개 가져오기
  const relatedComics = mockComics.filter(
    (c) => c.language === comic?.language && c.id !== params.id
  ).slice(0, 3);

  // 코믹을 찾을 수 없을 때 에러 페이지 표시
  if (!comic) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">Comic Not Found</h1>
          <button
            onClick={() => router.push("/")}
            className="text-[#58A6FF] hover:underline hover:cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // 현재 코믹이 저장되어 있는지 확인
  const isSaved = savedComics.includes(comic.id);

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-50 bg-[#0D1117]/80 backdrop-blur-md border-b border-[#30363D] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* 뒤로 가기 버튼 */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8B949E] hover:text-[#58A6FF] transition-all hover:scale-105 hover:cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Back</span>
          </button>

          {/* 뉴스레터, 공유 및 저장 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(openNewsletterModal())}
              className="p-2.5 hover:bg-[#161B22] rounded-xl transition-all hover:scale-110 hover:cursor-pointer"
              aria-label="Newsletter"
            >
              <Mail className="w-5 h-5 text-[#8B949E] hover:text-[#58A6FF]" />
            </button>
            <button
              onClick={() => dispatch(openShareModal(comic.id))}
              className="p-2.5 hover:bg-[#161B22] rounded-xl transition-all hover:scale-110 hover:cursor-pointer"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-[#8B949E] hover:text-[#58A6FF]" />
            </button>
            <button
              onClick={() => dispatch(toggleSavedComic(comic.id))}
              className="p-2.5 hover:bg-[#161B22] rounded-xl transition-all hover:scale-110 hover:cursor-pointer"
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              <Bookmark
                className={`w-5 h-5 ${
                  isSaved
                    ? "text-[#58A6FF] fill-[#58A6FF]"
                    : "text-[#8B949E] hover:text-[#58A6FF]"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 제목 섹션 */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#C9D1D9] mb-3">
                {comic.repoName}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm bg-[#58A6FF]/10 text-[#58A6FF] font-semibold px-4 py-1.5 rounded-full">
                  {comic.language}
                </span>
                <span className="text-[#8B949E] text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" />
                  {comic.stars.toLocaleString()} stars
                </span>
                {comic.isNew && (
                  <span className="bg-[#3FB950] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md animate-pulse">
                    NEW
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 코믹 패널 이미지 */}
        <div className="mb-10">
          <div className="space-y-5">
            {comic.panels.map((panel, index) => (
              <div
                key={index}
                className="group/panel relative aspect-[3/2] bg-[#161B22] rounded-2xl overflow-hidden border border-[#30363D] hover:border-[#58A6FF] shadow-md hover:shadow-2xl"
              >
                <Image
                  src={panel}
                  alt={`${comic.repoName} panel ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>

          {/* 진행 상태 표시 (패널 개수만큼 점으로 표시) */}
          <div className="flex justify-center gap-2 mt-8">
            {comic.panels.map((_, index) => (
              <div
                key={index}
                className="w-2.5 h-2.5 rounded-full bg-[#58A6FF] shadow-sm hover:scale-125 transition-transform cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* 주요 인사이트 */}
        <div className="mb-8 bg-[#161B22] border border-[#30363D] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#C9D1D9] mb-4">
            Key Insights
          </h2>
          <ul className="space-y-3">
            {comic.keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-2 flex-shrink-0" />
                <span className="text-[#8B949E]">{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 액션 버튼 (GitHub 보기, 다운로드) */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <a
            href={comic.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#58A6FF] text-white px-6 py-3 rounded-lg hover:bg-[#4A96E6] hover:cursor-pointer transition-colors font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            View on GitHub
          </a>
          <button className="flex items-center justify-center gap-2 bg-[#161B22] text-[#C9D1D9] border border-[#30363D] px-6 py-3 rounded-lg hover:border-[#58A6FF] hover:cursor-pointer transition-colors font-medium">
            <Download className="w-5 h-5" />
            Download Comic
          </button>
        </div>

        {/* 관련 코믹 (같은 언어) */}
        {relatedComics.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#C9D1D9] mb-6">
              More {comic.language} Comics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedComics.map((relatedComic) => (
                <ComicCard key={relatedComic.id} comic={relatedComic} />
              ))}
            </div>
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
