// functions/src/newsletter.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import nodemailer from "nodemailer";
import { SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT, FRONTEND_CONFIRM_URL } from "./config";
import crypto from "crypto";
import cors from "cors";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// Firestore 컬렉션
const NEWSLETTER_COL = "newsletter_subscriptions";

// Nodemailer 설정
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
} as any);

// 랜덤 토큰 생성
function generateToken(length = 24): string {
    return crypto.randomBytes(length).toString("hex");
}

/* ─────────────────────────────────────────────
 * (1) 구독 신청 API
 * POST /newsletterSubscribe
 * ────────────────────────────────────────────*/
export const newsletterSubscribe = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).json({
                    success: false,
                    status: "invalid",
                    message: "Method Not Allowed",
                });
                return;
            }

            const { email } = req.body as { email?: string };
            if (!email || typeof email !== "string") {
                res.status(400).json({
                    success: false,
                    status: "invalid",
                    message: "Invalid email",
                });
                return;
            }

            const normalizedEmail = email.trim().toLowerCase();
            const docRef = db.collection(NEWSLETTER_COL).doc(normalizedEmail);
            const existing = await docRef.get();
            const existingData = existing.exists ? existing.data() : null;
            const isActive =
                existingData &&
                (existingData.status === "confirmed" || existingData.status === "active");

            if (isActive) {
                res.status(200).json({
                    success: true,
                    status: "active",
                    message: "You're already subscribed.",
                });
                return;
            }

            const token = generateToken(24);
            const now = admin.firestore.Timestamp.now();

            await docRef.set(
                {
                    email: normalizedEmail,
                    token,
                    status: "pending",
                    createdAt: existingData?.createdAt ?? now,
                    confirmedAt: null,
                    unsubscribedAt: null,
                    updatedAt: now,
                },
                { merge: true }
            );

            const confirmLink = `${FRONTEND_CONFIRM_URL}?token=${encodeURIComponent(
                token
            )}`;

            await transporter.sendMail({
                from: `"TrendFeed Newsletter" <${SMTP_USER}>`,
                to: normalizedEmail,
                subject: "[TrendFeed] 뉴스레터 구독 확인 메일입니다",
                html: `
          <h2>TrendFeed 뉴스레터 가입을 환영합니다 🎉</h2>
          <p>아래 버튼을 눌러 구독을 완료해주세요.</p>
          <a href="${confirmLink}" style="
            display:inline-block;
            padding:12px 24px;
            background:#2563eb;
            color:#fff;
            border-radius:6px;
            text-decoration:none;
          ">구독 완료하기</a>
          <p>버튼이 안 눌리면 아래 링크를 복사하세요:<br>${confirmLink}</p>
        `,
            });

            res.status(200).json({
                success: true,
                status: "pending",
                message: "We've sent a confirmation link to your email.",
            });
        } catch (err) {
            console.error("newsletterSubscribe error:", err);
            res.status(500).json({
                success: false,
                status: "error",
                message: "Internal Server Error",
            });
        }
    });
});

/* ─────────────────────────────────────────────
 * (2) 구독 확인 API
 * GET /newsletterConfirm
 * ────────────────────────────────────────────*/
export const newsletterConfirm = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "GET") {
                return res.status(405).json({
                    success: false,
                    message: "Method Not Allowed. Use GET."
                });
            }

            // ❗ GET에서는 req.query에서 token을 읽어야 함
            const { token } = req.query as { token?: string };
            if (!token || typeof token !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid token",
                });
            }

            const snap = await db
                .collection(NEWSLETTER_COL)
                .where("token", "==", token)
                .limit(1)
                .get();

            if (snap.empty) {
                return res.status(404).json({
                    success: false,
                    status: "invalid",
                    message: "TOKEN_NOT_FOUND",
                });
            }

            const doc = snap.docs[0];
            const data = doc.data();

            // 이미 확인된 상태
            if (data.status === "confirmed" || data.status === "active") {
                return res.status(200).json({
                    success: true,
                    status: "active",
                    message: "Your subscription is already active.",
                });
            }

            // 최초 확인 처리
            await doc.ref.update({
                status: "active",
                confirmedAt: admin.firestore.Timestamp.now(),
            });

            return res.status(200).json({
                success: true,
                status: "active",
                message: "Subscription confirmed",
            });

        } catch (err) {
            console.error("newsletterConfirm error:", err);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    });
});

/* ─────────────────────────────────────────────
 * (3) 구독 해지 API
 * POST /newsletterUnsubscribe
 * ────────────────────────────────────────────*/
export const newsletterUnsubscribe = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).json({
                    success: false,
                    status: "invalid",
                    message: "Method Not Allowed",
                });
                return;
            }

            const { email, token } = req.body as { email?: string; token?: string };
            if (
                !email ||
                typeof email !== "string" ||
                !token ||
                typeof token !== "string"
            ) {
                res.status(400).json({
                    success: false,
                    status: "invalid",
                    message: "Invalid unsubscribe request",
                });
                return;
            }

            const normalizedEmail = email.trim().toLowerCase();
            const docRef = db.collection(NEWSLETTER_COL).doc(normalizedEmail);
            const doc = await docRef.get();

            if (!doc.exists) {
                res.status(404).json({
                    success: false,
                    status: "invalid",
                    message: "SUBSCRIPTION_NOT_FOUND",
                });
                return;
            }

            const data = doc.data() as {
                status?: string;
                token?: string;
            };

            if (data.token !== token) {
                res.status(401).json({
                    success: false,
                    status: "invalid",
                    message: "TOKEN_INVALID",
                });
                return;
            }

            if (data.status === "unsubscribed") {
                res.status(200).json({
                    success: true,
                    status: "unsubscribed",
                    message: "You are already unsubscribed.",
                });
                return;
            }

            await docRef.update({
                status: "unsubscribed",
                unsubscribedAt: admin.firestore.Timestamp.now(),
            });

            res.status(200).json({
                success: true,
                status: "unsubscribed",
                message: "You have been unsubscribed from TrendFeed emails.",
            });
        } catch (err) {
            console.error("newsletterUnsubscribe error:", err);
            res.status(500).json({
                success: false,
                status: "error",
                message: "Internal Server Error",
            });
        }
    });
});
