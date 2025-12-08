// src/components/AdRequestDialog.tsx

import { useState, useEffect } from "react";
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
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // 모달 닫을 때 내부 상태 전부 초기화
    useEffect(() => {
        if (!open) {
            setGithubUrl("");
            setHighlight("");
            setDuration("");
            setLoading(false);
            setSubmitted(false);
            setErrorMsg("");
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!githubUrl.trim()) {
            setErrorMsg("GitHub 주소를 입력해주세요.");
            return;
        }

        setLoading(true);
        setErrorMsg("");

        try {
            const res = await submitAdRequest({ githubUrl, highlight, duration });
            if (res.success) {
                setSubmitted(true);
            } else {
                setErrorMsg(res.message || "요청 중 오류가 발생했습니다.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("서버와 통신 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 오버레이 */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 내용 */}
            <div className="relative z-10 w-full max-w-md rounded-xl bg-[#0D1117] border border-[#30363D] shadow-xl p-6">
                <h2 className="text-xl font-semibold text-white">광고 문의</h2>
                <p className="text-sm text-[#8B949E] mt-1">
                    광고를 게시하고 싶다면 아래 내용을 작성해 주세요.
                </p>

                {/* 성공 상태 */}
                {submitted ? (
                    <div className="mt-6 text-center">
                        <p className="text-green-400 text-base">요청이 성공적으로 제출되었습니다.</p>
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Form */}
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-white mb-1">GitHub 주소</label>
                                <input
                                    className="w-full rounded-md bg-[#161B22] border border-[#30363D] px-3 py-2 text-white"
                                    placeholder="https://github.com/your-project"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-white mb-1">강조하고 싶은 내용</label>
                                <textarea
                                    className="w-full rounded-md bg-[#161B22] border border-[#30363D] px-3 py-2 text-white h-24"
                                    placeholder="프로젝트 소개 또는 강조 포인트"
                                    value={highlight}
                                    onChange={(e) => setHighlight(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-white mb-1">희망 광고 기간</label>
                                <input
                                    className="w-full rounded-md bg-[#161B22] border border-[#30363D] px-3 py-2 text-white"
                                    placeholder="예: 2주, 1개월"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>

                            {errorMsg && (
                                <p className="text-sm text-red-400 mt-2">{errorMsg}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? "전송 중..." : "전송"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
