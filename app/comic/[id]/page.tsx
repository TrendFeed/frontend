"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  Download,
  Bookmark,
  Mail,
} from "lucide-react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addSavedComicId,
  removeSavedComicId,
} from "@/lib/redux/slices/userSlice";
import { openShareModal, openNewsletterModal } from "@/lib/redux/slices/uiSlice";
import ShareModal from "@/components/ShareModal";
import NewsletterModal from "@/components/NewsletterModal";
import ComicCard from "@/components/ComicCard";
import { Comic } from "@/lib/types";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  fetchComicById,
  fetchComicsByLanguage,
} from "@/lib/api/comics";
import KeyInsightsComponent from "@/components/KeyInsights";
import CommentComponent from "@/components/CommentComponent";

export default function ComicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const savedComics = useAppSelector((state) => state.user.savedComics);
  const [comic, setComic] = useState<Comic | null>(null);
  const [relatedComics, setRelatedComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const comicId = useMemo(() => {
    const idParam = params?.id;
    if (!idParam) return null;
    const parsed = Array.isArray(idParam) ? Number(idParam[0]) : Number(idParam);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params]);

  useEffect(() => {
    if (!comicId) {
      setError("Invalid comic id.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadComic = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchComicById(comicId, controller.signal);
        setComic(result);

        if (result.language) {
          const related = await fetchComicsByLanguage(result.language, {
            page: 1,
            limit: 8,
            signal: controller.signal,
          });
          setRelatedComics(
            related.data.filter((relatedComic) => relatedComic.id !== result.id)
          );
        } else {
          setRelatedComics([]);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load comic:", err);
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Unable to load this comic.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadComic();

    return () => controller.abort();
  }, [comicId]);

  const isSaved = comic ? savedComics.includes(comic.id) : false;

  const handleSave = () => {
    if (!comic) return;
    if (!user) {
      alert("Please log in to save comics.");
      return;
    }

    if (isSaved) {
      dispatch(removeSavedComicId(comic.id));
    } else {
      dispatch(addSavedComicId(comic.id));
    }
  };

  const handleShare = () => {
    if (!comic) return;
    setComic((prev) =>
      prev ? { ...prev, shares: prev.shares + 1 } : prev
    );
    dispatch(openShareModal(comic));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-[#8B949E]">
        Loading comic...
      </div>
    );
  }

  if (error || !comic) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">
            {error || "Comic Not Found"}
          </h1>
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

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="sticky top-0 z-50 bg-[#0D1117]/80 backdrop-blur-md border-b border-[#30363D] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8B949E] hover:text-[#58A6FF] transition-all hover:scale-105 hover:cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(openNewsletterModal())}
              className="p-2.5 hover:bg-[#161B22] rounded-xl transition-all hover:scale-110 hover:cursor-pointer"
              aria-label="Newsletter"
            >
              <Mail className="w-5 h-5 text-[#8B949E] hover:text-[#58A6FF]" />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 hover:bg-[#161B22] rounded-xl transition-all hover:scale-110 hover:cursor-pointer"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-[#8B949E] hover:text-[#58A6FF]" />
            </button>
            <button
              onClick={handleSave}
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

      <main className="max-w-6xl mx-auto px-4 py-8">
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
                  <Image
                    src="/blue_star.png"
                    alt="star"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
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

        <div className="mb-10">
          {comic.panels.length > 0 ? (
            <div className="relative pt-10">
              <div className="absolute top-0 left-0 inline-flex items-center gap-2 rounded-full border border-[#30363D] bg-[#0D1117] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8B949E]">
                <span className="text-[#58A6FF]">읽는 순서</span>
                <span>↘</span>
                <span className="text-[#8B949E]/80">왼쪽에서 오른쪽</span>
              </div>
              <div className="grid grid-cols-2 auto-rows-[minmax(0,1fr)] gap-5">
                {comic.panels.map((panel, index) => (
                  <div
                    key={panel}
                    className="group/panel relative aspect-[3/2] bg-[#161B22] rounded-2xl overflow-hidden border border-[#30363D] hover:border-[#58A6FF] shadow-md hover:shadow-2xl"
                  >
                    <Image
                      src={panel}
                      alt={`${comic.repoName} panel ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover/panel:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
                      unoptimized
                    />
                    <span className="absolute top-4 left-4 bg-black/45 backdrop-blur text-xs font-semibold text-white px-2.5 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#30363D] bg-[#161B22] p-10 text-center text-[#8B949E]">
              Panels will be available soon.
            </div>
          )}
        </div>

        {/* 🚨 수정할 부분: Key Insights 원본 텍스트를 컴포넌트로 전달 */}
        {comic.keyInsights && typeof comic.keyInsights === 'string' && (
            <KeyInsightsComponent insightsText={comic.keyInsights} />
        )}

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

        <CommentComponent comicId={comic.id} />

        {relatedComics.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#C9D1D9] mb-6">
              More {comic.language} Comics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedComics.slice(0, 8).map((relatedComic) => (
                <ComicCard key={relatedComic.id} comic={relatedComic} />
              ))}
            </div>
          </div>
        )}
      </main>

      <ShareModal />
      <NewsletterModal />
    </div>
  );
}
