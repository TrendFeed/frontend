// functions/src/user.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

const corsHandler = cors({ origin: true });
const db = admin.firestore();

const USER_PROFILES = "user_profiles";
const SAVED_COMICS = "saved_comics";

/* ─────────────────────────────────────────────
 * (1) verifyUserSession
 * POST /verifyUserSession
 * ───────────────────────────────────────────── */
export const verifyUserSession = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send("Missing Authorization header");
                return;
            }

            const idToken = authHeader.replace("Bearer ", "");
            const decoded = await admin.auth().verifyIdToken(idToken);

            res.status(200).json({
                valid: true,
                uid: decoded.uid,
            });
        } catch (err) {
            console.error("verifyUserSession error:", err);
            res.status(401).json({ valid: false });
        }
    });
});

/* ─────────────────────────────────────────────
 * (2) getUserProfile
 * GET /getUserProfile
 * ───────────────────────────────────────────── */
export const getUserProfile = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "GET") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send("Unauthorized");
                return;
            }

            const idToken = authHeader.replace("Bearer ", "");
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const userRef = db.collection(USER_PROFILES).doc(uid);
            const snap = await userRef.get();

            if (!snap.exists) {
                // 기본 프로필 생성
                const defaultProfile = {
                    displayName: decoded.email?.split("@")[0] || "User",
                    preferences: {
                        interests: [],
                        notifications: {},
                        comicStyle: "default",
                    },
                };
                await userRef.set(defaultProfile);
                res.status(200).json(defaultProfile);
                return;
            }

            res.status(200).json(snap.data());
        } catch (err) {
            console.error("getUserProfile error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

/* ─────────────────────────────────────────────
 * (3) updateUserProfile
 * PUT /updateUserProfile
 * ───────────────────────────────────────────── */
export const updateUserProfile = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "PUT") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send("Unauthorized");
                return;
            }

            const idToken = authHeader.replace("Bearer ", "");
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const payload = req.body;

            await db.collection(USER_PROFILES).doc(uid).set(payload, { merge: true });

            const updated = await db.collection(USER_PROFILES).doc(uid).get();
            res.status(200).json(updated.data());
        } catch (err) {
            console.error("updateUserProfile error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

/* ─────────────────────────────────────────────
 * (4) getSavedComics
 * GET /getSavedComics?page=1&limit=50
 * ───────────────────────────────────────────── */
export const getSavedComics = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "GET") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send("Unauthorized");
                return;
            }

            const idToken = authHeader.replace("Bearer ", "");
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const page = Number(req.query.page ?? "1");
            const limit = Number(req.query.limit ?? "50");
            const offset = (page - 1) * limit;

            const ref = db.collection(SAVED_COMICS).doc(uid).collection("items");

            const snapshot = await ref
                .orderBy("createdAt", "desc")
                .offset(offset)
                .limit(limit)
                .get();

            const items = snapshot.docs.map((d) => d.data());

            const countSnap = await ref.count().get();
            const totalItems = countSnap.data().count;
            const totalPages = Math.ceil(totalItems / limit);

            res.status(200).json({
                data: items,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    itemsPerPage: limit,
                },
            });
        } catch (err) {
            console.error("getSavedComics error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

/* ─────────────────────────────────────────────
 * (5) saveUserComic
 * POST /saveUserComic
 * ───────────────────────────────────────────── */
export const saveUserComic = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send("Unauthorized");
                return;
            }

            const idToken = authHeader.replace("Bearer ", "");
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const { comicId } = req.body;
            if (!comicId) {
                res.status(400).send("Missing comicId");
                return;
            }

            await db
                .collection(SAVED_COMICS)
                .doc(uid)
                .collection("items")
                .doc(String(comicId))
                .set({
                    comicId,
                    createdAt: admin.firestore.Timestamp.now(),
                });

            res.status(200).json({ success: true });
        } catch (err) {
            console.error("saveUserComic error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

/* ─────────────────────────────────────────────
 * (6) removeSavedComic
 * POST /removeSavedComic
 * ───────────────────────────────────────────── */
export const removeSavedComic = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send("Unauthorized");
                return;
            }

            const idToken = authHeader.replace("Bearer ", "");
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const { comicId } = req.body;
            if (!comicId) {
                res.status(400).send("Missing comicId");
                return;
            }

            await db
                .collection(SAVED_COMICS)
                .doc(uid)
                .collection("items")
                .doc(String(comicId))
                .delete();

            res.status(200).json({ success: true });
        } catch (err) {
            console.error("removeSavedComic error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});
