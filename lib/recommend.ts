// getRecommendedCategories 함수 (수정)

import { db } from "./firebase/config";
import {
    collection,
    doc,
    getDocs,
    getDoc
} from "firebase/firestore";

/**
 * userId 기반으로 category 추천 점수를 만들어주는 함수 (v9 완전 호환)
 */
export async function getRecommendedCategories(userId: string) {
    // 1. saved_comics/{userId}/items 가져오기
    const itemsRef = collection(db, "saved_comics", userId, "items");
    const savedSnapshot = await getDocs(itemsRef);

    if (savedSnapshot.empty) {
        console.log(`[Recommender] No saved comics for user ${userId}`); // ✨ 로그 추가
        return [];
    }

    // comicId 목록
    const comicIds = savedSnapshot.docs.map((d) => d.data().comicId);

    // 2. comics 컬렉션에서 category 수집
    const categoryCount: Record<string, number> = {};

    for (const comicId of comicIds) {
        const comicRef = doc(db, "comics", String(comicId));
        const comicSnap = await getDoc(comicRef);

        if (!comicSnap.exists()) continue;

        const data = comicSnap.data();
        const categories = data?.category;

        if (!categories) continue;

        // category가 string인지 array인지 판단
        const categoryList = Array.isArray(categories)
            ? categories
            : [categories];

        // 카테고리 개수 증가
        for (const c of categoryList) {
            categoryCount[c] = (categoryCount[c] || 0) + 1;
        }
    }

    // 3. 추천 알고리즘 적용
    const ranked = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1]) // count desc
        .map(([category, score]) => ({ category, score }));

    // ✨ 최종 추천 목록 로그
    console.log(`[Recommender] Final Ranked Categories for ${userId}:`, ranked);

    return ranked;
}