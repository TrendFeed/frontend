// functions/src/comics.ts
import * as functions from "firebase-functions";
import { db, admin, COMICS_COL } from "./config";
import cors from "cors";

const corsHandler = cors({ origin: true });

type PanelsType = string[]; 

interface ComicDoc {
  
  id: number;
  repoName: string;
  repoUrl: string;
  stars: number;
  language?: string | null;
  panels: PanelsType | any; 
  title?: string | null;
  category?: string | null;
  keyInsights?: string | null;
  isNew: boolean;
  likes: number;
  shares: number;
  comments: any[];
  createdAt: admin.firestore.Timestamp | Date | null;
}

export interface ComicResponse {
  id: number;
  repoName: string;
  repoUrl: string;
  stars: number;
  language?: string | null;
  panels: PanelsType | any; // 레거시 호환
  title?: string | null;
  category?: string | null;
  keyInsights?: string | null;
  isNew: boolean;
  likes: number;
  shares: number;
  comments: any[];
  createdAt: Date | null;
  savedAt?: Date | null;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

function toDate(
  v: admin.firestore.Timestamp | Date | null | undefined
): Date | null {
  if (!v) return null;
  if (v instanceof admin.firestore.Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

async function resolveComicDocRefById(
  comicId: number
): Promise<FirebaseFirestore.DocumentReference | null> {

  const byDocId = db.collection(COMICS_COL).doc(String(comicId));
  const snap = await byDocId.get();
  if (snap.exists) return byDocId;

  const q = await db
    .collection(COMICS_COL)
    .where("id", "==", comicId)
    .limit(1)
    .get();

  if (q.empty) return null;
  return q.docs[0].ref;
}

export function mapComicDocToResponse(
  doc: FirebaseFirestore.DocumentSnapshot
): ComicResponse {
  const data = doc.data() as ComicDoc;

  return {
    id: data.id,
    repoName: data.repoName,
    repoUrl: data.repoUrl,
    stars: data.stars,
    language: data.language ?? null,
    panels: data.panels,
    title: data.title ?? null,
    category: data.category ?? null,
    keyInsights: data.keyInsights ?? null,
    isNew: data.isNew,
    likes: data.likes,
    shares: data.shares,
    comments: data.comments ?? [],
    createdAt: toDate(data.createdAt),
  };
}

function getSortField(sortBy?: string): string {
  switch (sortBy) {
    case "stars":
      return "stars";
    case "likes":
      return "likes";
    case "latest":
    default:
      return "createdAt";
  }
}

// GET /api/comics
export const getComics = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const pageParam = req.query.page as string | undefined;
      const limitParam = req.query.limit as string | undefined;
      const sortBy = (req.query.sortBy as string | undefined) ?? "latest";

      let page = Number(pageParam ?? "1");
      let limit = Number(limitParam ?? "12");

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit <= 0) limit = 12;

      const sortField = getSortField(sortBy);
      const offset = (page - 1) * limit;

      const query = db.collection(COMICS_COL).orderBy(sortField, "desc");
      const snapshot = await query.offset(offset).limit(limit).get();

      const comics: ComicResponse[] = snapshot.docs.map(mapComicDocToResponse);

      const countQuery = db.collection(COMICS_COL).orderBy(sortField, "desc");
      const agg = await countQuery.count().get();
      const totalItems = agg.data().count;
      const totalPages = Math.ceil(totalItems / limit);

      const response: PaginatedResponse<ComicResponse> = {
        data: comics,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      };

      res.status(200).json(response);
    } catch (err) {
      console.error("getComics error", err);
      res.status(500).send("Internal Server Error");
    }
  });
});

// GET /api/comic?id=123
export const getComicById = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const idParam = req.query.id as string | undefined;
      if (!idParam) {
        res.status(400).send("Missing id");
        return;
      }

      const comicId = Number(idParam);
      if (isNaN(comicId)) {
        res.status(400).send("Invalid id");
        return;
      }

      const docRef = await resolveComicDocRefById(comicId);
      if (!docRef) {
        res.status(404).send("COMIC_NOT_FOUND");
        return;
      }

      const doc = await docRef.get();
      const comic = mapComicDocToResponse(doc);
      res.status(200).json(comic);
    } catch (err) {
      console.error("getComicById error", err);
      res.status(500).send("Internal Server Error");
    }
  });
});

// GET /api/comics/new
export const getNewComics = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const pageParam = req.query.page as string | undefined;
      const limitParam = req.query.limit as string | undefined;

      let page = Number(pageParam ?? "1");
      let limit = Number(limitParam ?? "12");

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit <= 0) limit = 12;

      const offset = (page - 1) * limit;

      const baseQuery = db
        .collection(COMICS_COL)
        .where("isNew", "==", true)
        .orderBy("createdAt", "desc");

      const snapshot = await baseQuery.offset(offset).limit(limit).get();
      const comics: ComicResponse[] = snapshot.docs.map(mapComicDocToResponse);

      const agg = await baseQuery.count().get();
      const totalItems = agg.data().count;
      const totalPages = Math.ceil(totalItems / limit);

      const response: PaginatedResponse<ComicResponse> = {
        data: comics,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      };

      res.status(200).json(response);
    } catch (err) {
      console.error("getNewComics error", err);
      res.status(500).send("Internal Server Error");
    }
  });
});

// GET /api/comics/by-language?language=TypeScript
export const getComicsByLanguage = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const language = req.query.language as string | undefined;
      if (!language) {
        res.status(400).send("Missing language");
        return;
      }

      const pageParam = req.query.page as string | undefined;
      const limitParam = req.query.limit as string | undefined;

      let page = Number(pageParam ?? "1");
      let limit = Number(limitParam ?? "12");

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit <= 0) limit = 12;

      const offset = (page - 1) * limit;

      const baseQuery = db
        .collection(COMICS_COL)
        .where("language", "==", language)
        .orderBy("stars", "desc");

      const snapshot = await baseQuery.offset(offset).limit(limit).get();
      const comics: ComicResponse[] = snapshot.docs.map(mapComicDocToResponse);

      const agg = await baseQuery.count().get();
      const totalItems = agg.data().count;
      const totalPages = Math.ceil(totalItems / limit);

      const response: PaginatedResponse<ComicResponse> = {
        data: comics,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      };

      res.status(200).json(response);
    } catch (err) {
      console.error("getComicsByLanguage error", err);
      res.status(500).send("Internal Server Error");
    }
  });
});

// POST /api/comics/like
export const likeComic = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { comicId } = req.body as { comicId?: number | string };
      if (comicId == null) {
        res.status(400).send("Missing comicId");
        return;
      }

      const idNum = Number(comicId);
      if (isNaN(idNum)) {
        res.status(400).send("Invalid comicId");
        return;
      }

      const docRef = await resolveComicDocRefById(idNum);
      if (!docRef) {
        res.status(404).send("COMIC_NOT_FOUND");
        return;
      }

      await docRef.update({
        likes: admin.firestore.FieldValue.increment(1),
      });

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("likeComic error", err);
      
      
      res.status(500).send("Internal Server Error");
    }
  });
});

// POST /api/comics/share
export const shareComic = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { comicId } = req.body as { comicId?: number | string };
      if (comicId == null) {
        res.status(400).send("Missing comicId");
        return;
      }

      const idNum = Number(comicId);
      if (isNaN(idNum)) {
        res.status(400).send("Invalid comicId");
        return;
      }

      const docRef = await resolveComicDocRefById(idNum);
      if (!docRef) {
        res.status(404).send("COMIC_NOT_FOUND");
        return;
      }

      await docRef.update({
        shares: admin.firestore.FieldValue.increment(1),
      });

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("shareComic error", err);
      res.status(500).send("Internal Server Error");
    }
  });
});
