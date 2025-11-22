// functions/src/comics.ts
import * as functions from "firebase-functions";
import { db, admin, COMICS_COL } from "./config";
import cors from "cors";
const corsHandler = cors({origin: true});

interface ComicDoc {
    id: number;
    repoName: string;
    repoUrl: string;
    stars: number;
    language?: string | null;
    panels: any;
    keyInsights?: string | null;
    isNew: boolean;
    likes: number;
    shares: number;
    comments: any;
    createdAt: admin.firestore.Timestamp | Date | null;
}

interface ComicResponse {
    id: number;
    repoName: string;
    repoUrl: string;
    stars: number;
    language?: string | null;
    panels: any;
    keyInsights?: string | null;
    isNew: boolean;
    likes: number;
    shares: number;
    comments: any;
    createdAt: Date | null;
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

function mapComicDocToResponse(doc: FirebaseFirestore.DocumentSnapshot): ComicResponse {
    const data = doc.data() as ComicDoc;
    let createdAt: Date | null = null;

    if (data.createdAt instanceof admin.firestore.Timestamp) {
        createdAt = data.createdAt.toDate();
    } else if (data.createdAt instanceof Date) {
        createdAt = data.createdAt;
    }

    return {
        id: data.id,
        repoName: data.repoName,
        repoUrl: data.repoUrl,
        stars: data.stars,
        language: data.language ?? null,
        panels: data.panels,
        keyInsights: data.keyInsights ?? null,
        isNew: data.isNew,
        likes: data.likes,
        shares: data.shares,
        comments: data.comments,
        createdAt,
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

        let query = db.collection(COMICS_COL).orderBy(sortField, "desc");

        const snapshot = await query.offset(offset).limit(limit).get();

        const comics: ComicResponse[] = snapshot.docs.map(mapComicDocToResponse);

        const countQuery = db.collection(COMICS_COL).orderBy(sortField, "desc");
        const agg = await countQuery.count().get();
        const totalItems = agg.data().count;
        const totalPages = Math.ceil(totalItems / limit);

        const pagination: PaginationInfo = {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
        };

        const response: PaginatedResponse<ComicResponse> = {
            data: comics,
            pagination,
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

        const docRef = db.collection(COMICS_COL).doc(String(idParam));
        const doc = await docRef.get();

        if (!doc.exists) {
            res.status(404).send("COMIC_NOT_FOUND");
            return;
        }

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

        let baseQuery = db
            .collection(COMICS_COL)
            .where("isNew", "==", true)
            .orderBy("createdAt", "desc");

        const snapshot = await baseQuery.offset(offset).limit(limit).get();
        const comics: ComicResponse[] = snapshot.docs.map(mapComicDocToResponse);

        const agg = await baseQuery.count().get();
        const totalItems = agg.data().count;
        const totalPages = Math.ceil(totalItems / limit);

        const pagination: PaginationInfo = {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
        };

            const response: PaginatedResponse<ComicResponse> = {
                data: comics,
                pagination,
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

        let baseQuery = db
            .collection(COMICS_COL)
            .where("language", "==", language)
            .orderBy("stars", "desc");

        const snapshot = await baseQuery.offset(offset).limit(limit).get();
        const comics: ComicResponse[] = snapshot.docs.map(mapComicDocToResponse);

        const agg = await baseQuery.count().get();
        const totalItems = agg.data().count;
        const totalPages = Math.ceil(totalItems / limit);

        const pagination: PaginationInfo = {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
        };

            const response: PaginatedResponse<ComicResponse> = {
                data: comics,
                pagination,
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
        if (!comicId) {
            res.status(400).send("Missing comicId");
            return;
        }

        const docRef = db.collection(COMICS_COL).doc(String(comicId));
        const doc = await docRef.get();
        if (!doc.exists) {
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
    corsHandler(req,res, async()=> {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const {comicId} = req.body as { comicId?: number | string };
            if (!comicId) {
                res.status(400).send("Missing comicId");
                return;
            }

            const docRef = db.collection(COMICS_COL).doc(String(comicId));
            const doc = await docRef.get();
            if (!doc.exists) {
                res.status(404).send("COMIC_NOT_FOUND");
                return;
            }

            await docRef.update({
                shares: admin.firestore.FieldValue.increment(1),
            });

            res.status(200).json({success: true});
        } catch (err) {
            console.error("shareComic error", err);
            res.status(500).send("Internal Server Error");
        }
    })
});
