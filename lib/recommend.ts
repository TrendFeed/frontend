import { db } from "./firebase/config";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    QueryDocumentSnapshot
} from "firebase/firestore";

/**
 * userId 기반으로 category 추천 점수를 만들어주는 함수 (v9 완전 호환)
 *
 * 가중치 방식: saved item의 createdAt을 사용한 지수 감쇠 (exponential decay).
 * - halfLifeDays: '가중치가 절반으로 줄어드는 기간(일)' (기본 5일)
 *
 * 반환: [{ category: string, score: number, rawCount?: number }]
 */
export async function getRecommendedCategories(
    userId: string,
) {
    const halfLifeDays = 5; // 기본 반감기: 30일

    // 1. saved_comics/{userId}/items 가져오기
    const itemsRef = collection(db, "saved_comics", userId, "items");
    const savedSnapshot = await getDocs(itemsRef);

    if (savedSnapshot.empty) {
        console.log(`[Recommender] No saved comics for user ${userId}`);
        return [];
    }

    // 현재 시간 (ms)
    const now = Date.now();

    // Helper: Firestore Timestamp 또는 Date/number 처리를 통합
    function getTimeMs(createdAt: any): number | null {
        if (!createdAt) return null;
        // Firestore Timestamp object (has toDate)
        if (typeof createdAt.toDate === "function") {
            return createdAt.toDate().getTime();
        }
        // Date object
        if (createdAt instanceof Date) {
            return createdAt.getTime();
        }
        // 숫자(타임스탬프 ms)
        if (typeof createdAt === "number") {
            // assume ms
            return createdAt;
        }
        // ISO string
        if (typeof createdAt === "string") {
            const t = Date.parse(createdAt);
            return isNaN(t) ? null : t;
        }
        return null;
    }

    // 2. saved items에서 (comicId, createdAt) 목록 구성
    type SavedItem = { comicId: string; createdAtMs: number | null };

    const savedItems: SavedItem[] = savedSnapshot.docs.map(
        (d: QueryDocumentSnapshot) => {
            const data = d.data();
            const comicId = String(data?.comicId ?? data?.comicID ?? data?.id ?? "");
            const createdAtMs = getTimeMs(data?.createdAt ?? data?.created_at ?? null);
            return { comicId, createdAtMs };
        }
    ).filter((it) => it.comicId !== "");

    if (savedItems.length === 0) {
        console.log(`[Recommender] No valid saved items for user ${userId}`);
        return [];
    }

    // 3. 각 saved item에 대한 가중치 계산 (지수 감쇠)
    // 지수 감쇠 공식: weight = 2^(-ageDays / halfLifeDays)
    // => ageDays = (now - createdAt) / (1000*60*60*24)
    function computeWeight(createdAtMs: number | null): number {
        if (!createdAtMs) return 1; // 생성일 정보가 없으면 기본 가중치 1
        const ageMs = Math.max(0, now - createdAtMs);
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const weight = Math.pow(2, -ageDays / halfLifeDays);
        return weight;
    }

    // 4. comics 문서들을 병렬로 가져오기 (중복 comicId에 대해 중복 fetch 방지)
    const uniqueComicIds = Array.from(new Set(savedItems.map((s) => s.comicId)));
    const comicFetchPromises = uniqueComicIds.map(async (comicId) => {
        const comicRef = doc(db, "comics", String(comicId));
        const comicSnap = await getDoc(comicRef);
        if (!comicSnap.exists()) return { comicId, data: null as null | any };
        return { comicId, data: comicSnap.data() };
    });

    const comicDocs = await Promise.all(comicFetchPromises);
    const comicMap = new Map<string, any>();
    for (const c of comicDocs) {
        if (c.data) comicMap.set(c.comicId, c.data);
    }

    // 5. 카테고리별 누적 가중치 계산
    type CategoryAggregate = { weightedScore: number; rawCount: number };
    const categoryCount: Record<string, CategoryAggregate> = {};

    for (const saved of savedItems) {
        const comicData = comicMap.get(saved.comicId);
        if (!comicData) continue;

        const categories = comicData?.category;
        if (!categories) continue;

        const categoryList = Array.isArray(categories) ? categories : [categories];

        const weight = computeWeight(saved.createdAtMs);

        for (const c of categoryList) {
            if (!c) continue;
            if (!categoryCount[c]) categoryCount[c] = { weightedScore: 0, rawCount: 0 };
            categoryCount[c].weightedScore += weight;
            categoryCount[c].rawCount += 1;
        }
    }

    // 6. 정렬 및 반환 (weightedScore 내림차순)
    const ranked = Object.entries(categoryCount)
        .map(([category, agg]) => ({
            category,
            score: agg.weightedScore,
            rawCount: agg.rawCount
        }))
        .sort((a, b) => b.score - a.score);

    console.log(`[Recommender] Final Ranked Categories for ${userId}:`, ranked);
    return ranked;
}
