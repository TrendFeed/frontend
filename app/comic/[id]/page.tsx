"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share2, ExternalLink, Download, Bookmark } from "lucide-react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleSavedComic } from "@/lib/redux/slices/userSlice";
import { openShareModal } from "@/lib/redux/slices/uiSlice";
import { mockComics } from "@/lib/mockData";
import ComicCard from "@/components/ComicCard";
import ShareModal from "@/components/ShareModal";

export default function ComicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const savedComics = useAppSelector((state) => state.user.savedComics);

  const comic = mockComics.find((c) => c.id === params.id);
  const relatedComics = mockComics.filter(
    (c) => c.language === comic?.language && c.id !== params.id
  ).slice(0, 3);

  if (!comic) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#C9D1D9] mb-2">Comic Not Found</h1>
          <button
            onClick={() => router.push("/")}
            className="text-[#58A6FF] hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isSaved = savedComics.includes(comic.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(openShareModal(comic.id))}
              className="p-2.5 hover:bg-accent-light rounded-xl transition-all hover:scale-110"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-text-secondary hover:text-primary" />
            </button>
            <button
              onClick={() => dispatch(toggleSavedComic(comic.id))}
              className="p-2.5 hover:bg-accent-light rounded-xl transition-all hover:scale-110"
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              <Bookmark
                className={`w-5 h-5 ${
                  isSaved
                    ? "text-primary fill-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-3">
                {comic.repoName}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm bg-accent-light text-primary font-semibold px-4 py-1.5 rounded-full">
                  {comic.language}
                </span>
                <span className="text-text-secondary text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" />
                  {comic.stars.toLocaleString()} stars
                </span>
                {comic.isNew && (
                  <span className="bg-success text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md animate-pulse">
                    NEW
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comic Panels */}
        <div className="mb-10">
          <div className="space-y-5">
            {comic.panels.map((panel, index) => (
              <div
                key={index}
                className="group/panel relative aspect-[3/2] bg-surface rounded-2xl overflow-hidden border border-border hover:border-primary shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Image
                  src={panel}
                  alt={`${comic.repoName} panel ${index + 1}`}
                  fill
                  className="object-cover transform group-hover/panel:scale-105 transition-transform duration-500 ease-out"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/panel:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm text-text-secondary text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover/panel:opacity-100 transition-opacity duration-300">
                  Panel {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {comic.panels.map((_, index) => (
              <div
                key={index}
                className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm hover:scale-125 transition-transform cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* Key Insights */}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <a
            href={comic.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#58A6FF] text-white px-6 py-3 rounded-lg hover:bg-[#4A96E6] transition-colors font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            View on GitHub
          </a>
          <button className="flex items-center justify-center gap-2 bg-[#161B22] text-[#C9D1D9] border border-[#30363D] px-6 py-3 rounded-lg hover:border-[#58A6FF] transition-colors font-medium">
            <Download className="w-5 h-5" />
            Download Comic
          </button>
        </div>

        {/* Related Comics */}
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

      <ShareModal />
    </div>
  );
}
