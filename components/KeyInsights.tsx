// src/components/KeyInsightsComponent.tsx (수정된 코드)

import { Lightbulb, ChevronsRight } from "lucide-react";

interface KeyInsightsProps {
    insightsText: string;
}

/**
 * AI가 생성한 원문 Key Insights 텍스트를 파싱하여 구조화된 형태로 보여주는 컴포넌트
 */
export default function KeyInsightsComponent({ insightsText }: KeyInsightsProps) {
    if (!insightsText || insightsText.trim().length === 0) return null;

const paragraphs = insightsText
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

const structuredContent: { type: "heading" | "list" | "paragraph"; content: string[] | string }[] = [];

paragraphs.forEach(paragraph => {
    const lines = paragraph.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const titleRegex = /^(.*?)\s*[:\u2013\u2014-]\s*/;
    const titleMatch = lines[0].match(titleRegex);

    if (titleMatch) {
        const title = titleMatch[1].trim();
        const restOfLine = lines[0].substring(titleMatch[0].length).trim();
        structuredContent.push({ type: "heading", content: title });

        const allContentLines = [restOfLine, ...lines.slice(1)].filter(l => l.length > 0);
        let currentList: string[] = [];

        allContentLines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                currentList.push(trimmed.replace(/^[-\•]\s*/, '').trim());
            } else {
                if (currentList.length > 0) {
                    structuredContent.push({ type: "list", content: currentList });
                    currentList = [];
                }
                structuredContent.push({ type: "paragraph", content: trimmed });
            }
        });

        if (currentList.length > 0) structuredContent.push({ type: "list", content: currentList });
    } else {
        lines.forEach(line => structuredContent.push({ type: "paragraph", content: line }));
    }
});

return (
    <div className="mb-8 max-w-4xl mx-auto bg-[#161B22] border border-[#30363D] rounded-xl p-6 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3 mb-6 border-b border-[#30363D] pb-3">
            <Lightbulb className="w-6 h-6 text-[#F9A826]" />
            <h2 className="text-2xl font-extrabold text-[#C9D1D9]">Deep Dive Insights</h2>
        </div>

        <div className="space-y-5">
            {structuredContent.map((item, idx) => {
                switch (item.type) {
                    case 'heading':
                        return (
                            <h3 key={idx} className="text-lg sm:text-xl font-bold text-[#58A6FF] bg-[#1F6FEB]/10 px-4 py-2 rounded-md shadow-sm border-l-4 border-[#58A6FF]">
                                {item.content as string}
                            </h3>
                        );
                    case 'paragraph':
                        return (
                            <p key={idx} className="text-[#C9D1D9] text-sm sm:text-base leading-relaxed">
                                {item.content as string}
                            </p>
                        );
                    case 'list':
                        return (
                            <ul key={idx} className="pl-6 list-disc space-y-2 text-[#C9D1D9]">
                                {(item.content as string[]).map((li, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <ChevronsRight className="w-4 h-4 mt-1 text-[#3FB950]" />
                                        <span>{li}</span>
                                    </li>
                                ))}
                            </ul>
                        );
                }
            })}
        </div>
    </div>
);

}
