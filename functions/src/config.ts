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

export const SEARCH_YEARS = Number(process.env.SEARCH_YEARS ?? "2");
export const MIN_STARS = Number(process.env.MIN_STARS ?? "3000");
export const MAX_PAGES = Number(process.env.MAX_PAGES ?? "10");
export const PER_PAGE = Number(process.env.PER_PAGE ?? "50");
export const SLEEP_MILLIS = Number(process.env.SLEEP_MILLIS ?? "500");

export const STAR_PIVOT_STARS = Number(process.env.STAR_PIVOT_STARS ?? "5000");
export const STAR_FACTOR_ALPHA = Number(process.env.STAR_FACTOR_ALPHA ?? "0.25");
export const STAR_FACTOR_MIN = Number(process.env.STAR_FACTOR_MIN ?? "0.6");
export const STAR_FACTOR_MAX = Number(process.env.STAR_FACTOR_MAX ?? "1.4");

export const TARGET_STARS_PER_DAY = Number(process.env.TARGET_STARS_PER_DAY ?? "50");

export const AGE_HALF_LIFE_DAYS = Number(process.env.AGE_HALF_LIFE_DAYS ?? "1000");
export const GROWTH_WEIGHT = Number(process.env.GROWTH_WEIGHT ?? "1.0");
export const PENALTY_WEIGHT = Number(process.env.PENALTY_WEIGHT ?? "1.0");
export const TREND_THRESHOLD = Number(process.env.TREND_THRESHOLD ?? "30.0");

export const FRONTEND_CONFIRM_URL =
  process.env.FRONTEND_CONFIRM_URL || "https://trendfeed.kr/newsletter/confirm";

export const GITHUB_API_BASE = "https://api.github.com";

// Firestore 컬렉션 이름
export const REPOS_COL = "repos";
export const CANDIDATES_COL = "candidates";
export const COMICS_COL = "comics";
