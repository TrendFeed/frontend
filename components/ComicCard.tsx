"use client";

import { MessageCircle, Share2, Bookmark } from "lucide-react";
import { Comic } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addSavedComicId,
  removeSavedComicId,
  toggleLikedComic,
} from "@/lib/redux/slices/userSlice";
import { openShareModal } from "@/lib/redux/slices/uiSlice";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/contexts/AuthContext";
import { saveComic, unsaveComic } from "@/lib/api/user";
import { likeComic, shareComic } from "@/lib/api/comics";
import { updateComicMetrics } from "@/lib/redux/slices/comicsSlice";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useEffect, useState } from "react";

interface ComicCardProps {
  comic: Comic;
}

export default function ComicCard({ comic }: ComicCardProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const savedComics = useAppSelector((state) => state.user.savedComics);
  const likedComics = useAppSelector((state) => state.user.likedComics);

  const isSaved = savedComics.includes(comic.id);
  const isLiked = likedComics.includes(comic.id);

  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const numericComicId = Number(comic.id);
        console.log("🔍 Fetching comments for comicId:", numericComicId);

        const q = query(
            collection(db, "comments"),
            where("comicId", "==", numericComicId)
        );

        const snapshot = await getDocs(q);
        console.log("📌 Found comments:", snapshot.size);

        snapshot.forEach((doc) => {
          console.log("🟦 Comment:", doc.id, doc.data());
        });

        setCommentCount(snapshot.size);
      } catch (error) {
        console.error("❌ Failed to load comment count:", error);
      }
    };

    fetchComments();
  }, [comic.id]);
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    } catch (error) {
      console.error("Failed to toggle saved comic:", error);
      alert("Unable to update saved comics. Please try again.");
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await likeComic(comic.id);
      dispatch(toggleLikedComic(comic.id));
      dispatch(
          updateComicMetrics({
            id: comic.id,
            changes: { likes: comic.likes + 1 },
          })
      );
    } catch (error) {
      console.error("Failed to like comic:", error);
      alert("Unable to like this comic right now.");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await shareComic(comic.id);
      dispatch(
          updateComicMetrics({
            id: comic.id,
            changes: { shares: comic.shares + 1 },
          })
      );
    } catch (error) {
      console.error("Failed to record share:", error);
    }
    dispatch(openShareModal(comic));
  };

  const previewPanel = comic.panels[0];
  const secondaryPanels = comic.panels.slice(1, 4);
  const remainingPanels = Math.max(
      0,
      comic.panels.length - (1 + secondaryPanels.length)
  );

  return (
      <Link href={`/comic/${comic.id}`}>
        <div
            className="
          comic-card group/item
          bg-[#141A22] border border-border rounded-2xl overflow-hidden
          transition-all duration-[500ms] ease-in-out
          hover:-translate-y-2 hover:scale-[1.08]
          hover:shadow-[0_0_40px_-10px_rgba(60,100,180,0.25)]
          hover:bg-[#233045]"
        >
          {/* 미리보기 */}
          <div className="relative aspect-[3/2] bg-[#0D1117] overflow-hidden">
            {previewPanel ? (
                <Image
                    src={previewPanel}
                    alt={`${comic.title} preview panel`}
                    fill
                    className="object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover/item:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                />
            ) : (
                <div className="flex h-full items-center justify-center text-[#9CA3AF] text-sm">
                  Preview coming soon
                </div>
            )}

            {secondaryPanels.length > 0 && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  {secondaryPanels.map((panel, index) => (
                      <div
                          key={`${comic.id}-secondary-${index}`}
                          className="relative w-14 h-9 rounded-md overflow-hidden border border-white/15 shadow-lg shadow-black/30"
                      >
                        <Image
                            src={panel}
                            alt={`${comic.title} panel thumbnail ${index + 2}`}
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                        />
                      </div>
                  ))}
                  {remainingPanels > 0 && (
                      <span className="text-xs font-semibold text-white/90 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur">
                  +{remainingPanels}
                </span>
                  )}
                </div>
            )}

            {comic.isNew && (
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                  NEW
                </div>
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="relative z-10 p-5 transition-colors duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)]">

            {/* Title */}
            <h3
                className="
    mb-3
    font-semibold
    text-[1.05rem]
    leading-snug
    tracking-tight
    text-gray-100
    line-clamp-3
    group-hover/item:text-blue-50
    transition-colors duration-[1200ms]
  "
            >
              {comic.title}
            </h3>

            {/* Meta: Language + Category */}
            <div className="flex flex-wrap gap-2 mb-4">
  <span
      className="
      text-xs
      bg-[#243447]
      text-blue-300
      font-medium
      px-3 py-1
      rounded-full
      whitespace-nowrap
      transition-colors
      group-hover/item:bg-blue-600
      group-hover/item:text-white
    "
  >
    {comic.language}
  </span>

              {comic.category && (
                  <span
                      className="
        text-xs
        bg-[#19232F]
        text-blue-300
        font-medium
        px-3 py-1
        rounded-full
        border border-white/10
        whitespace-nowrap
      "
                  >
      {comic.category}
    </span>
              )}
            </div>
            {/* Stars */}
            <div className="flex items-center gap-1.5 mb-4">
              <Image
                  src="/blue_star.png"
                  alt="star"
                  width={16}
                  height={16}
                  className="w-4 h-4"
              />
              <span className="text-sm text-gray-400 font-medium group-hover/item:text-blue-100 transition-colors duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
              {comic.stars.toLocaleString()}
            </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border-light text-gray-400 group-hover/item:text-blue-100 transition-colors duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
              <div className="flex items-center gap-5">
                <button
                    onClick={handleLike}
                    className="flex items-center gap-1.5 text-sm transition-transform duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{commentCount}</span>
                  </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                    onClick={handleShare}
                    className="p-2 rounded-lg transition-all duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:bg-[#1f3a5f]"
                    aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                    onClick={handleSave}
                    className="p-2 rounded-lg transition-all duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:bg-[#1f3a5f]"
                    aria-label={isSaved ? "Unsave" : "Save"}
                >
                  <Bookmark
                      className={`w-4 h-4 ${
                          isSaved
                              ? "text-blue-300 fill-blue-300"
                              : "text-gray-400 hover:text-blue-200"
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
