// functions/src/ai.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, COMICS_COL } from "./config";
import cors from "cors";

const corsHandler = cors({ origin: true });

/*
 * POST /postComicFromAI
 *
 * Worker → 백엔드에 만화 생성 완료되었음을 notify
 * Firestore COMICS_COL에 새로운 문서로 저장
 */

export const postComicFromAI = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const body = req.body;
            const {
                repoName,
                repoUrl,
                stars,
                language,
                panels,         // base64 이미지 배열
                keyInsights,    // summary or scenario
            } = body;

            if (!repoName || !repoUrl || !panels) {
                res.status(400).send("Missing required fields (repoName, repoUrl, panels)");
                return;
            }

            // Firestore auto-id 기반 정렬 + 중복 방지 위해 id 부여 가능
            const docRef = db.collection(COMICS_COL).doc();

            const now = admin.firestore.Timestamp.now();

            const comicDoc = {
                id: parseInt(docRef.id, 36) || Date.now(),
                repoName,
                repoUrl,
                stars: stars ?? 0,
                language: language ?? null,
                panels,
                keyInsights: keyInsights ?? null,
                isNew: true,
                likes: 0,
                shares: 0,
                comments: [],
                createdAt: now,
            };

            await docRef.set(comicDoc);

            res.status(200).json({
                success: true,
                message: "Comic posted to Firestore",
                comicId: comicDoc.id,
            });
        } catch (err) {
            console.error("postComicFromAI error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});
