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
 * POST /api/newsletter/subscribe
 * ────────────────────────────────────────────*/
export const newsletterSubscribe = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const { email } = req.body as { email?: string };
            if (!email || typeof email !== "string") {
                res.status(400).send("Invalid email");
                return;
            }

            const normalizedEmail = email.trim().toLowerCase();
            const token = generateToken(24);

            const docRef = db.collection(NEWSLETTER_COL).doc(normalizedEmail);
            const now = admin.firestore.Timestamp.now();

            await docRef.set(
                {
                    email: normalizedEmail,
                    token,
                    status: "pending",
                    createdAt: now,
                    confirmedAt: null,
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
                message: "Confirmation email sent",
            });
        } catch (err) {
            console.error("newsletterSubscribe error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

/* ─────────────────────────────────────────────
 * (2) 구독 확인 API
 * POST /api/newsletter/confirm
 * ────────────────────────────────────────────*/
export const newsletterConfirm = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const { token } = req.body as { token?: string };
            if (!token || typeof token !== "string") {
                res.status(400).send("Invalid token");
                return;
            }

            const snap = await db
                .collection(NEWSLETTER_COL)
                .where("token", "==", token)
                .limit(1)
                .get();

            if (snap.empty) {
                res.status(404).send("TOKEN_NOT_FOUND");
                return;
            }

            const doc = snap.docs[0];
            const data = doc.data();

            if (data.status === "confirmed") {
                res.status(200).json({
                    success: true,
                    message: "Already confirmed",
                });
                return;
            }

            await doc.ref.update({
                status: "confirmed",
                confirmedAt: admin.firestore.Timestamp.now(),
            });

            res.status(200).json({
                success: true,
                message: "Subscription confirmed",
            });
        } catch (err) {
            console.error("newsletterConfirm error:", err);
            res.status(500).send("Internal Server Error");
        }
    });
});
