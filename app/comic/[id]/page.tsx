"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  fetchComicById,
  fetchComicsByLanguage,
  shareComic,
} from "@/lib/api/comics";
import { saveComic, unsaveComic } from "@/lib/api/user";
import { Comic } from "@/lib/types";
import { useAuth } from "@/lib/contexts/AuthContext";

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
            limit: 4,
            signal: controller.signal,
          });
          setRelatedComics(
            related.data.filter((relatedComic) => relatedComic.id !== result.id)
          );
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to load comic:", err);
        setError(err?.message || "Unable to load this comic.");
      } finally {
        setLoading(false);
      }
    };

    void loadComic();

    return () => controller.abort();
  }, [comicId]);

  const isSaved = comic ? savedComics.includes(comic.id) : false;

  const handleSave = async () => {
    if (!comic) return;
    if (!user) {
      alert("Please log in to save comics.");
      return;
    }

    try {
      if (isSaved) {
        await unsaveComic(comic.id);
        dispatch(removeSavedComicId(comic.id));
      } else {
        await saveComic(comic.id);
        dispatch(addSavedComicId(comic.id));
      }
    } catch (err) {
      console.error("Failed to toggle saved comic:", err);
      alert("Unable to update saved comics right now.");
    }
  };

  const handleShare = async () => {
    if (!comic) return;
    try {
      await shareComic(comic.id);
    } catch (err) {
      console.error("Failed to record share:", err);
    }
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

      <main className="max-w-4xl mx-auto px-4 py-8">
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
          ) : (
            <div className="rounded-2xl border border-dashed border-[#30363D] bg-[#161B22] p-10 text-center text-[#8B949E]">
              Panels will be available soon.
            </div>
          )}

          {comic.panels.length > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              {comic.panels.map((_, index) => (
                <div
                  key={index}
                  className="w-2.5 h-2.5 rounded-full bg-[#58A6FF] shadow-sm hover:scale-125 transition-transform cursor-pointer"
                />
              ))}
            </div>
          )}
        </div>

        {comic.keyInsights.length > 0 && (
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

        {relatedComics.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#C9D1D9] mb-6">
              More {comic.language} Comics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedComics.slice(0, 3).map((relatedComic) => (
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
