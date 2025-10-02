"use client";

import { X, Twitter, Linkedin, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { closeShareModal } from "@/lib/redux/slices/uiSlice";
import { mockComics } from "@/lib/mockData";

export default function ShareModal() {
  const dispatch = useAppDispatch();
  const { shareModalOpen, shareModalComicId } = useAppSelector(
    (state) => state.ui
  );
  const [copied, setCopied] = useState(false);

  if (!shareModalOpen || !shareModalComicId) return null;

  const comic = mockComics.find((c) => c.id === shareModalComicId);
  if (!comic) return null;

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/comic/${comic.id}`;
  const shareText = `Check out this comic about ${comic.repoName}!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: "twitter" | "linkedin") => {
    let url = "";
    if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === "linkedin") {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl
      )}`;
    }
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleClose = () => {
    dispatch(closeShareModal());
    setCopied(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#30363D]">
            <h2 className="text-xl font-bold text-[#C9D1D9]">
              Share Comic
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-[#0D1117] rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#8B949E]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Comic Info */}
            <div className="mb-6">
              <h3 className="font-semibold text-[#C9D1D9] mb-1">
                {comic.repoName}
              </h3>
              <p className="text-sm text-[#8B949E]">
                {comic.stars.toLocaleString()} stars • {comic.language}
              </p>
            </div>

            {/* Share Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleShare("twitter")}
                className="w-full flex items-center gap-3 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span className="font-medium">Share on Twitter</span>
              </button>

              <button
                onClick={() => handleShare("linkedin")}
                className="w-full flex items-center gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span className="font-medium">Share on LinkedIn</span>
              </button>
            </div>

            {/* Copy Link */}
            <div className="border-t border-[#30363D] pt-6">
              <label className="text-sm text-[#8B949E] mb-2 block">
                Or copy link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#C9D1D9] focus:outline-none focus:border-[#58A6FF]"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 bg-[#58A6FF] hover:bg-[#4A96E6] text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
