// functions/src/config.ts
import * as admin from "firebase-admin";

admin.initializeApp();
export const db = admin.firestore();
export { admin };

// ──────────────────────────────────────────────────────────────
// 환경 변수 (process.env 사용)
// ──────────────────────────────────────────────────────────────

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; // 필수 (GitHub PAT)

export const GROWTH_K = Number(process.env.GROWTH_K ?? "3.0");          // growth 민감도
export const SEARCH_YEARS = Number(process.env.SEARCH_YEARS ?? "3");    // 최근 N년
export const MIN_STARS = Number(process.env.MIN_STARS ?? "500");        // 최소 스타
export const MAX_PAGES = Number(process.env.MAX_PAGES ?? "3");          // 검색 페이지 수
export const PER_PAGE = Number(process.env.PER_PAGE ?? "50");           // per_page
export const SLEEP_MILLIS = Number(process.env.SLEEP_MILLIS ?? "500");  // 깃헙 API 사이 딜레이(ms)

export const AGE_HALF_LIFE_DAYS = Number(process.env.AGE_HALF_LIFE_DAYS ?? "365");
export const GROWTH_WEIGHT = Number(process.env.GROWTH_WEIGHT ?? "1.0");
export const PENALTY_WEIGHT = Number(process.env.PENALTY_WEIGHT ?? "1.0");
export const TREND_THRESHOLD = Number(process.env.TREND_THRESHOLD ?? "60.0");

// 환경변수
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
export const SMTP_PORT = process.env.SMTP_PORT || "465";

export const FRONTEND_CONFIRM_URL =
    process.env.FRONTEND_CONFIRM_URL ||
    "https://trendfeed.kr/newsletter/confirm";

// GitHub API base URL
export const GITHUB_API_BASE = "https://api.github.com";

// Firestore 컬렉션 이름
export const REPOS_COL = "repos";
export const CANDIDATES_COL = "candidates";
export const COMICS_COL = "comics";
