// functions/src/newsletter.ts
import functions from 'firebase-functions';
import * as admin from "firebase-admin";
import nodemailer from "nodemailer";
import { FRONTEND_CONFIRM_URL } from "./config";
import crypto from "crypto";
import cors from "cors";
import { Request, Response } from "express";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

import { defineSecret } from "firebase-functions/params";

const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");

// Firestore 컬렉션
const NEWSLETTER_COL = "newsletter_subscriptions";
const NOTIFICATION_COL = "notifications";


// Nodemailer 설정
const transporter = nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port: Number(SMTP_PORT.value()),
    secure: Number(SMTP_PORT.value()) === 465,
    auth: {
        user: SMTP_USER.value(),
        pass: SMTP_PASS.value(),
    },
});

// 랜덤 토큰 생성
function generateToken(length = 24): string {
    return crypto.randomBytes(length).toString("hex");
}

/* ─────────────────────────────────────────────
 * (1) 구독 신청 API
 * POST /newsletterSubscribe
 * ────────────────────────────────────────────*/
export const newsletterSubscribe = functions.https.onRequest((req: Request, res:Response) => {
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
export const newsletterConfirm = functions.https.onRequest((req:Request, res:Response) => {
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
export const newsletterUnsubscribe = functions.https.onRequest((req:Request, res:Response) => {
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

// ─────────────────────────────────────────────
// INTERNAL: 뉴스레터 발송 함수
// ─────────────────────────────────────────────
export async function sendNewsletterInternal(params: {
    fullName: string;
    comicId: string;
    summary: string;
}) {
    const { fullName, comicId, summary } = params;

    // 활성 구독자만 조회
    const subsSnap = await db
        .collection(NEWSLETTER_COL)
        .where("status", "==", "active")
        .where("unsubscribedAt", "==", null)
        .get();

    if (subsSnap.empty) {
        console.log("[Newsletter] No active subscribers.");
        return;
    }

    const batch = db.batch();
    const subscribers = subsSnap.docs.map((d) => d.id);

    // Firestore notifications 생성
    for (const email of subscribers) {
        const ref = db.collection(NOTIFICATION_COL).doc();
        batch.set(ref, {
            id: ref.id,
            email,
            title: `New trending comic: ${fullName}`,
            description: summary,
            comicId,
            timestamp: Date.now(),
            read: false,
            actionLabel: "View comic",
            actionHref: `/comic/${comicId}`,
            category: "newsletter",
        });
    }

    await batch.commit();

    // 이메일 발송
    for (const email of subscribers) {
        await transporter.sendMail({
            from: `"TrendFeed Newsletter" <${SMTP_USER}>`,
            to: email,
            subject: `[TrendFeed] New comic is ready: ${fullName}`,
            html: `
        <h2>${fullName} Comic is Live! 🎉</h2>
        <p>${summary}</p>
        <p>
          <a href="https://trendfeed.kr/comic/${comicId}" style="
            display:inline-block;
            padding:12px 24px;
            background:#2563eb;
            color:#fff;
            border-radius:6px;
            text-decoration:none;
          ">만화 보러가기</a>
        </p>
      `,
        });
    }

    console.log(`[Newsletter] Sent to ${subscribers.length} subscribers.`);
}

export const submitAdRequest = functions.https.onRequest((req:Request, res:Response) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const { githubUrl, highlight, duration } = req.body;

            if (!githubUrl || !highlight || !duration) {
                res.status(400).send("Missing required fields");
                return;
            }

            // Firestore 저장
            const ref = db.collection("advertise_requests").doc();
            await ref.set({
                id: ref.id,
                githubUrl,
                highlight,
                duration,
                createdAt: Date.now(),
                status: "pending",
            });

            // 이메일 발송
            await transporter.sendMail({
                from: `"TrendFeed Ads" <${SMTP_USER}>`,
                to: "onlyforteamusage@gmail.com",
                subject: "📢 새로운 광고 요청이 도착했습니다",
                html: `
          <h2>📢 광고 요청</h2>
          <p><b>GitHub:</b> ${githubUrl}</p>
          <p><b>내용:</b> ${highlight}</p>
          <p><b>기간:</b> ${duration}</p>
          <p><b>요청 ID:</b> ${ref.id}</p>
        `,
            });

            res.status(200).send({
                success: true,
                message: "Ad request successfully submitted",
                id: ref.id,
            });
        } catch (err) {
            console.error("Error submitting ad request:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});