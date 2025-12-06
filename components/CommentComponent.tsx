"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc,
    where
} from "firebase/firestore";
import Image from "next/image";

interface Comment {
    id: string;
    text: string;
    userId: string;
    displayName: string;
    createdAt: any;
    comicId: number;
}

export default function CommentComponent({ comicId }: { comicId: number }) {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔥 Firestore 댓글 실시간 구독
    useEffect(() => {
        const q = query(
            collection(db, "comments"),
            where("comicId", "==", comicId),  // ✔ comicId 필터
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Comment[];

            setComments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [comicId]);

    // ✏️ 댓글 작성
    const handleSubmit = async () => {
        if (!user) {
            alert("Please log in to leave a comment.");
            return;
        }
        if (!newComment.trim()) return;

        await addDoc(collection(db, "comments"), {
            comicId: comicId,
            text: newComment.trim(),
            userId: user.uid,
            displayName: user.displayName || "Anonymous",
            createdAt: serverTimestamp(),
        });

        setNewComment("");
    };

    // 🗑 댓글 삭제
    const handleDelete = async (id: string, userId: string) => {
        if (!user || user.uid !== userId) {
            alert("You can only delete your own comments.");
            return;
        }

        await deleteDoc(doc(db, "comments", id)); // ✔ items 제거
    };

    return (
        <div className="mb-12 p-6 rounded-xl bg-[#161B22] border border-[#30363D] shadow-md">
            <h2 className="text-2xl font-bold text-[#C9D1D9] mb-6">Comments</h2>

            {/* 댓글 입력 */}
            <div className="flex flex-col gap-3 mb-6">
        <textarea
            className="w-full bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] p-3 rounded-lg outline-none focus:border-[#58A6FF]"
            rows={3}
            placeholder={
                user ? "Write a comment..." : "Login required to write a comment."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user}
        />

                <button
                    onClick={handleSubmit}
                    disabled={!user}
                    className={`px-5 py-2 rounded-lg font-medium transition-all w-fit ${
                        user
                            ? "bg-[#58A6FF] text-white hover:bg-[#4A96E6]"
                            : "bg-[#30363D] text-[#8B949E] cursor-not-allowed"
                    }`}
                >
                    Post Comment
                </button>
            </div>

            {/* 댓글 리스트 */}
            {loading ? (
                <p className="text-[#8B949E]">Loading comments...</p>
            ) : comments.length === 0 ? (
                <p className="text-[#8B949E]">No comments yet. Be the first!</p>
            ) : (
                <div className="flex flex-col gap-5">
                    {comments.map((c) => (
                        <div
                            key={c.id}
                            className="flex justify-between items-start border-b border-[#30363D]/60 pb-4"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#C9D1D9] font-semibold text-sm">
                    {c.displayName}
                  </span>
                                    <span className="text-[#8B949E] text-xs">
                    {c.createdAt?.toDate
                        ? c.createdAt.toDate().toLocaleString()
                        : "…"}
                  </span>
                                </div>

                                <p className="text-[#C9D1D9] text-sm whitespace-pre-line">
                                    {c.text}
                                </p>
                            </div>

                            {/* 삭제 버튼 */}
                            {user && user.uid === c.userId && (
                                <button
                                    onClick={() => handleDelete(c.id, c.userId)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
