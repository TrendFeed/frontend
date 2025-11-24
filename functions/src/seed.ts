// functions/src/seed.ts

import { onRequest } from "firebase-functions/v2/https";
import { db, admin, COMICS_COL } from "./config";
import cors from "cors";

const corsHandler = cors({ origin: true });

const sampleComics = [
    {
        id: 1,
        repoName: "vercel/next.js",
        repoUrl: "https://github.com/vercel/next.js",
        stars: 120000,
        language: "JavaScript",
        panels: [
            "https://placehold.co/600x800?text=Panel+1",
            "https://placehold.co/600x800?text=Panel+2"
        ],
        keyInsights: ["Fast React framework", "Good DX"],
        isNew: true,
        likes: 0,
        shares: 0,
        comments: [],
        createdAt: admin.firestore.Timestamp.now()
    },
    {
        id: 2,
        repoName: "facebook/react",
        repoUrl: "https://github.com/facebook/react",
        stars: 210000,
        language: "TypeScript",
        panels: [
            "https://placehold.co/600x800?text=React+Panel+1",
            "https://placehold.co/600x800?text=React+Panel+2"
        ],
        keyInsights: ["UI library", "Components everywhere"],
        isNew: true,
        likes: 0,
        shares: 0,
        comments: [],
        createdAt: admin.firestore.Timestamp.now()
    }
];

// 실행 여부 체크용 문서 이름
const MARKER_DOC = "seed_initialized";

/*
 * 실행 후 Firestore에 seed_initialized 문서를 만들어놓고
 * 다음 실행부터는 중복 생성되지 않도록 한다.
 */
export const seedComics = onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const markerRef = db.collection("system").doc(MARKER_DOC);
            const markerSnap = await markerRef.get();

            if (markerSnap.exists) {
                res.status(200).json({ message: "Seed already initialized, skipped." });
                return;
            }

            // comics 컬렉션에 예시 문서 작성
            const batch = db.batch();

            for (const comic of sampleComics) {
                batch.set(db.collection(COMICS_COL).doc(String(comic.id)), comic);
            }

            // seed 완료 마커 생성
            batch.set(markerRef, {
                initializedAt: admin.firestore.Timestamp.now(),
            });

            await batch.commit();

            res.status(200).json({ message: "Seed completed." });
        } catch (error) {
            console.error("seedComics error:", error);
            res.status(500).send("Internal Server Error");
        }
    });
});
