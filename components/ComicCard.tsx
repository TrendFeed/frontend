"use client";

import { Star, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Comic } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleSavedComic, toggleLikedComic } from "@/lib/redux/slices/userSlice";
import { openShareModal } from "@/lib/redux/slices/uiSlice";
import Link from "next/link";
import Image from "next/image";

interface ComicCardProps {
  comic: Comic;
}

export default function ComicCard({ comic }: ComicCardProps) {
  const dispatch = useAppDispatch();
  const savedComics = useAppSelector((state) => state.user.savedComics);
  const likedComics = useAppSelector((state) => state.user.likedComics);

  const isSaved = savedComics.includes(comic.id);
  const isLiked = likedComics.includes(comic.id);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(toggleSavedComic(comic.id));
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(toggleLikedComic(comic.id));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(openShareModal(comic.id));
  };

  return (
    <Link href={`/comic/${comic.id}`}>
      <div className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        {/* Comic Preview */}
        <div className="relative aspect-[3/2] bg-background-dark overflow-hidden">
          <div className="grid grid-cols-2 gap-1 h-full p-1">
            {comic.panels.slice(0, 2).map((panel, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden">
                <Image
                  src={panel}
                  alt={`${comic.repoName} panel ${index + 1}`}
                  fill
                  className="object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
          {comic.isNew && (
            <div className="absolute top-3 right-3 bg-success text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              NEW
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title and Language */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="text-text-primary font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
              {comic.repoName}
            </h3>
            <span className="text-xs bg-accent-light text-primary font-medium px-3 py-1 rounded-full whitespace-nowrap">
              {comic.language}
            </span>
          </div>

          {/* GitHub Stars */}
          <div className="flex items-center gap-1.5 mb-4">
            <Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" />
            <span className="text-sm text-text-secondary font-medium">
              {comic.stars.toLocaleString()}
            </span>
          </div>

          {/* Engagement Metrics */}
          <div className="flex items-center justify-between pt-4 border-t border-border-light">
            <div className="flex items-center gap-5">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors group/like"
              >
                <MessageCircle className="w-4 h-4 group-hover/like:scale-110 transition-transform" />
                <span className="font-medium">{isLiked ? comic.likes + 1 : comic.likes}</span>
              </button>
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Share2 className="w-4 h-4" />
                <span className="font-medium">{comic.shares}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-accent-light rounded-lg transition-all hover:scale-110"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-text-secondary hover:text-primary" />
              </button>
              <button
                onClick={handleSave}
                className="p-2 hover:bg-accent-light rounded-lg transition-all hover:scale-110"
                aria-label={isSaved ? "Unsave" : "Save"}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isSaved
                      ? "text-primary fill-primary"
                      : "text-text-secondary hover:text-primary"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
