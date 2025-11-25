import * as admin from "firebase-admin";

const STORAGE_BUCKET =
  process.env.STORAGE_BUCKET || "trendfeed-cb56b.firebasestorage.app";

admin.initializeApp({
  storageBucket: STORAGE_BUCKET,
});

export const db = admin.firestore();
export { admin };
export { STORAGE_BUCKET };

// ──────────────────────────────────────────────────────────────
// 환경 변수 (process.env 사용)
// ──────────────────────────────────────────────────────────────

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; // 필수 (GitHub PAT)

export const GROWTH_K = Number(process.env.GROWTH_K ?? "3.0");
export const SEARCH_YEARS = Number(process.env.SEARCH_YEARS ?? "3");
export const MIN_STARS = Number(process.env.MIN_STARS ?? "500");
export const MAX_PAGES = Number(process.env.MAX_PAGES ?? "3");
export const PER_PAGE = Number(process.env.PER_PAGE ?? "50");
export const SLEEP_MILLIS = Number(process.env.SLEEP_MILLIS ?? "500");

export const AGE_HALF_LIFE_DAYS = Number(process.env.AGE_HALF_LIFE_DAYS ?? "365");
export const GROWTH_WEIGHT = Number(process.env.GROWTH_WEIGHT ?? "1.0");
export const PENALTY_WEIGHT = Number(process.env.PENALTY_WEIGHT ?? "1.0");
export const TREND_THRESHOLD = Number(process.env.TREND_THRESHOLD ?? "60.0");

export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
export const SMTP_PORT = process.env.SMTP_PORT || "465";

export const FRONTEND_CONFIRM_URL =
  process.env.FRONTEND_CONFIRM_URL || "https://trendfeed.kr/newsletter/confirm";

export const GITHUB_API_BASE = "https://api.github.com";

// Firestore 컬렉션 이름
export const REPOS_COL = "repos";
export const CANDIDATES_COL = "candidates";
export const COMICS_COL = "comics";
