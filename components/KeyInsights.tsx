// src/components/KeyInsightsComponent.tsx

import { Lightbulb, ChevronsRight } from "lucide-react";

interface KeyInsightsProps {
    insightsText: string;
}

interface ContentBlock {
    type: "heading" | "list" | "paragraph";
    content: string | string[];
}

/**
 * AI가 생성한 원문 Key Insights 텍스트를 파싱하여 구조화된 형태로 보여주는 컴포넌트
 * (## 로 시작하는 줄을 제목으로 인식)
 */
export default function KeyInsightsComponent({ insightsText }: KeyInsightsProps) {
    if (!insightsText || insightsText.trim().length === 0) return null;

    // 1. 텍스트를 줄 단위로 분리하고 빈 줄 제거
    const lines = insightsText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    const structuredContent: ContentBlock[] = [];
    let currentList: string[] = [];

    // 리스트 버퍼를 비우는 헬퍼 함수
    const flushList = () => {
        if (currentList.length > 0) {
            structuredContent.push({ type: "list", content: [...currentList] });
            currentList = [];
        }
    };

    lines.forEach(line => {
        // Case 1: 제목 (## 으로 시작)
        if (line.startsWith("##")) {
            flushList(); // 이전 리스트가 있다면 저장
            const title = line.replace(/^##\s*/, "").trim(); // ## 제거
            structuredContent.push({ type: "heading", content: title });
        }
        // Case 2: 리스트 아이템 (- 또는 • 으로 시작)
        else if (line.startsWith("-") || line.startsWith("•")) {
            const listItem = line.replace(/^[-•]\s*/, "").trim();
            currentList.push(listItem);
        }
        // Case 3: 일반 문단
        else {
            flushList(); // 일반 문단이 나오면 이전 리스트는 끝난 것으로 간주
            structuredContent.push({ type: "paragraph", content: line });
        }
    });

    // 루프 종료 후 남은 리스트가 있다면 저장
    flushList();

    return (
        <section className="mb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[#F9A826]" />
                <h2 className="text-xl font-bold text-[#C9D1D9]">
                    Key Insights
                </h2>
            </div>

            {/* Content */}
            <div className="space-y-6 border-l border-[#30363D] pl-6">
                {structuredContent.map((item, idx) => {
                    switch (item.type) {
                        case "heading":
                            return (
                                <h3
                                    key={idx}
                                    className="text-lg font-semibold text-[#58A6FF] mt-8 first:mt-0"
                                >
                                    {item.content as string}
                                </h3>
                            );

                        case "paragraph":
                            return (
                                <p
                                    key={idx}
                                    className="text-[#C9D1D9] text-sm sm:text-base leading-relaxed"
                                >
                                    {item.content as string}
                                </p>
                            );

                        case "list":
                            return (
                                <ul key={idx} className="space-y-2">
                                    {(item.content as string[]).map((li, i) => (
                                        <li
                                            key={i}
                                            className="text-[#C9D1D9] text-sm sm:text-base leading-relaxed pl-4 relative"
                                        >
                                            <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 bg-[#3FB950] rounded-full" />
                                            {li}
                                        </li>
                                    ))}
                                </ul>
                            );

                        default:
                            return null;
                    }
                })}
            </div>
        </section>
    );
}