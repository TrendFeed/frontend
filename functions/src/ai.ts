// functions/src/ai.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, COMICS_COL } from "./config";
import cors from "cors";
import { randomUUID } from "crypto";

const corsHandler = cors({ origin: true });

function decodeBase64Image(input: string): { buffer: Buffer; contentType: string; ext: string } {
  
  const m = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const contentType = m?.[1] ?? "image/png";
  const b64 = m?.[2] ?? input;

  const cleaned = b64.replace(/\s+/g, "");

  const buffer = Buffer.from(cleaned, "base64");

  // derive extension
  const ext = contentType.split("/")[1]?.toLowerCase() || "png";
  return { buffer, contentType, ext };
}

/*
 * POST /postComicFromAI
 */
export const postComicFromAI = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const body = req.body ?? {};
      const { repoName, repoUrl, stars, language, panels, keyInsights } = body as {
        repoName?: string;
        repoUrl?: string;
        stars?: number;
        language?: string | null;
        panels?: unknown;
        keyInsights?: string | null;
      };

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
              // Firebase Storage public download URL token
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
        repoName,
        repoUrl,
        stars: typeof stars === "number" ? stars : 0,
        language: language ?? null,
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
        panelsCount: panelUrls.length,
      });
    } catch (err) {
      console.error("postComicFromAI error:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});
