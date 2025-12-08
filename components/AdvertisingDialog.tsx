// src/components/AdRequestDialog.tsx

import { useState } from "react";
import { submitAdRequest } from "@/lib/api/submitAdRequest";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function AdRequestDialog({ open, onClose }: Props) {
    const [githubUrl, setGithubUrl] = useState("");
    const [highlight, setHighlight] = useState("");
    const [duration, setDuration] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async () => {
        setLoading(true);
        setSuccessMsg("");

        try {
            const res = await submitAdRequest({ githubUrl, highlight, duration });
            if (res.success) {
                setSuccessMsg("요청이 성공적으로 제출되었습니다.");
                setGithubUrl("");
                setHighlight("");
                setDuration("");
            }
        } catch (err) {
            console.error(err);
            setSuccessMsg("요청 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-[#161B22] border border-[#30363d] rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl mb-4 text-white">광고 요청</h2>

                <label className="text-sm text-gray-300">GitHub 주소</label>
                <input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full p-2 mb-3 bg-[#0D1117] border border-[#30363d] rounded text-white"
                />

                <label className="text-sm text-gray-300">강조하고 싶은 내용</label>
                <textarea
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    className="w-full p-2 mb-3 bg-[#0D1117] border border-[#30363d] rounded text-white h-24"
                />

                <label className="text-sm text-gray-300">광고 기간</label>
                <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2 mb-4 bg-[#0D1117] border border-[#30363d] rounded text-white"
                />

                {successMsg && (
                    <p className="text-sm text-green-400 mb-3">{successMsg}</p>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-white rounded"
                    >
                        닫기
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {loading ? "전송 중..." : "전송"}
                    </button>
                </div>
            </div>
        </div>
    );
}
