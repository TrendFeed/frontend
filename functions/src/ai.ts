import * as functions from "firebase-functions";
import cors from "cors";
import { randomUUID } from "crypto";
import { admin, db, COMICS_COL, STORAGE_BUCKET } from "./config";

const corsHandler = cors({ origin: true });

function decodeBase64Image(input: string): { buffer: Buffer; contentType: string; ext: string } {
  const m = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const contentType = m?.[1] ?? "image/png";
  const b64 = m?.[2] ?? input;

  const cleaned = b64.replace(/\s+/g, "");
  const buffer = Buffer.from(cleaned, "base64");

  const ext = contentType.split("/")[1]?.toLowerCase() || "png";
  return { buffer, contentType, ext };
}

/*
 * POST /postComicFromAI
 * AI -> (base64 panels + title/category) -> Storage 업로드 -> Firestore에는 다운로드 URL 저장
 */
export const postComicFromAI = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      console.log("[postComicFromAI] invoked", {
        method: req.method,
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        bucketConfigured: STORAGE_BUCKET,
      });

      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const body = (req.body ?? {}) as {
        jobId?: string;
        repoName?: string;
        repoUrl?: string;
        stars?: number;
        language?: string | null;
        panels?: unknown;
        keyInsights?: string | null;

        // ✅ 추가: AI가 만들어서 보내줄 값
        title?: string | null;
        category?: string | null;
      };

      const { jobId, repoName, repoUrl, stars, language, panels, keyInsights, title, category } = body;

      if (!repoName || !repoUrl) {
        res.status(400).send("Missing required fields (repoName, repoUrl)");
        return;
      }

      if (!Array.isArray(panels) || panels.length === 0) {
        res.status(400).send("Missing required fields (panels[])");
        return;
      }

      const now = admin.firestore.Timestamp.now();
      const comicId = now.toMillis();
      const docRef = db.collection(COMICS_COL).doc(String(comicId));

      // ✅ 기본 버킷 사용(InitializeApp의 storageBucket 설정을 신뢰)
      // 필요 시 bucket.name으로 실제 버킷 확인 가능
      const bucket = admin.storage().bucket();

      const panelUrls: string[] = [];

      for (let i = 0; i < panels.length; i++) {
        const part = panels[i];

        if (typeof part !== "string" || part.trim().length === 0) {
          res.status(400).send(`Invalid panels[${i}] (must be non-empty base64 string)`);
          return;
        }

        const { buffer, contentType, ext } = decodeBase64Image(part);

        const token = randomUUID();
        const filePath = `comics/${comicId}/panel_${i}.${ext}`;
        const file = bucket.file(filePath);

        await file.save(buffer, {
          resumable: false,
          metadata: {
            contentType,
            metadata: {
              firebaseStorageDownloadTokens: token,
            },
          },
        });

        const url =
          `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
          `${encodeURIComponent(filePath)}?alt=media&token=${token}`;

        panelUrls.push(url);
      }

      const comicDoc = {
        id: comicId,
        jobId: jobId ?? null,
        repoName,
        repoUrl,
        stars: typeof stars === "number" ? stars : 0,
        language: language ?? null,

        // ✅ 저장
        title: title ?? null,
        category: category ?? null,

        panels: panelUrls,
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
        message: "Comic posted to Firestore + Storage",
        comicId,
        bucket: bucket.name,
        panelsCount: panelUrls.length,
        savedTitle: comicDoc.title,
        savedCategory: comicDoc.category,
      });
    } catch (err) {
      console.error("postComicFromAI error:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});
