// functions/src/github.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as functions from "firebase-functions";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";


import {
    db,
    GITHUB_TOKEN,
    GITHUB_API_BASE,
    REPOS_COL,
    CANDIDATES_COL,
    SEARCH_YEARS,
    MIN_STARS,
    MAX_PAGES,
    PER_PAGE,
    SLEEP_MILLIS,
    AGE_HALF_LIFE_DAYS,
    GROWTH_WEIGHT,
    PENALTY_WEIGHT,
    TREND_THRESHOLD,
    TARGET_STARS_PER_DAY,
    STAR_PIVOT_STARS,
    STAR_FACTOR_ALPHA,
    STAR_FACTOR_MIN,
    STAR_FACTOR_MAX,
} from "./config";
import { sendNewsletterInternal } from "./newsletter"
const corsHandler = cors({ origin: true });


// ──────────────────────────────────────────────────────────────
// 유틸 타입
// ──────────────────────────────────────────────────────────────

interface GitHubRepoDoc {
    id: number;
    nodeId?: string;
    name?: string;
    fullName?: string;
    ownerLogin?: string;
    htmlUrl?: string;
    description?: string | null;
    language?: string | null;

    stargazersCount?: number | null;
    createdAt?: any
    pushedAt?: Date | null;
    updatedAt?: Date | null;

    previousStars?: number | null;
    growthRate?: number | null;
    trendScore?: number | null;
    trendStage?: number | null;

    lastCrawledAt?: any
    lastCheckedAt?: any

    readmeText?: string | null;
    readmeSha?: string | null;
    readmeEtag?: string | null;
}

interface CandidateDoc {
    repoId: number;
    fullName: string;
    promotedAt: Date;
    givenToAI: boolean;
}

// ──────────────────────────────────────────────────────────────
// 공용 GitHub 호출 유틸
// ──────────────────────────────────────────────────────────────

async function githubGetJson(path: string, extraHeaders: Record<string, string> = {}) {
    if (!GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN is not set");
    }

    const res = await fetch(GITHUB_API_BASE + path, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "trendfeed-firebase-functions",
            ...extraHeaders,
        },
    });

    if (res.status === 304 || res.status === 404) {
        // README 없는 경우/변화 없는 경우 등
        return { status: res.status, body: null as any };
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub GET ${path} failed: ${res.status} - ${text}`);
    }

    const json = await res.json();
    return { status: res.status, body: json };
}

function parseTime(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

function splitFullName(fullName: string): { owner: string; repo: string } {
    if (!fullName || !fullName.includes("/")) {
        throw new Error("fullName must be like 'owner/repo'");
    }
    const [owner, repo] = fullName.split("/", 2).map((x) => x.trim());
    return { owner, repo };
}

function orZero(v: number | null | undefined): number {
    return v == null ? 0 : v;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────────────────────
// Firestore: GitHubRepoDoc 읽기/쓰기
// ──────────────────────────────────────────────────────────────

async function getRepoDocById(id: number): Promise<GitHubRepoDoc | null> {
    const doc = await db.collection(REPOS_COL).doc(String(id)).get();
    if (!doc.exists) return null;
    const data = doc.data() as any;
    return data as GitHubRepoDoc;
}

async function saveRepoDoc(repo: GitHubRepoDoc): Promise<void> {
    await db.collection(REPOS_COL).doc(String(repo.id)).set(
        {
            ...repo,
        },
        { merge: true }
    );
}

// ──────────────────────────────────────────────────────────────
// README 수집
// ──────────────────────────────────────────────────────────────

async function fetchAndAttachReadme(owner: string, repoName: string, e: GitHubRepoDoc): Promise<GitHubRepoDoc> {
    const headers: Record<string, string> = {};
    if (e.readmeEtag) {
        headers["If-None-Match"] = e.readmeEtag;
    }

    try {
        const { status, body } = await githubGetJson(`/repos/${owner}/${repoName}/readme`, headers);

        if (status === 304 || status === 404 || !body) {
            // 변경 없음 또는 README 없음
            return e;
        }

        const encoded = body.content as string | undefined;
        const encoding = body.encoding as string | undefined;
        const sha = body.sha as string | undefined;
        const etag = body.etag as string | undefined; // 실제 응답 헤더에 없을 수도 있음

        let text: string | null = null;
        if (encoded && encoding && encoding.toLowerCase() === "base64") {
            const buf = Buffer.from(encoded, "base64");
            text = buf.toString("utf-8");
        }

        e.readmeText = text;
        e.readmeSha = sha ?? null;
        if (etag) {
            e.readmeEtag = etag;
        }

        return e;
    } catch (err) {
        console.error("fetchAndAttachReadme error", err);
        return e;
    }
}

// ──────────────────────────────────────────────────────────────
// GitHub meta → GitHubRepoDoc 매핑
// ──────────────────────────────────────────────────────────────

function mapMetaToRepoDoc(meta: any, existing: GitHubRepoDoc | null): GitHubRepoDoc {
    const e: GitHubRepoDoc = existing ?? { id: meta.id };

    const prevStarsBefore: number | null = e.stargazersCount != null ? e.stargazersCount : null;

    e.id = meta.id;
    e.nodeId = meta.node_id;
    e.name = meta.name;
    e.fullName = meta.full_name;

    const owner = meta.owner || {};
    e.ownerLogin = owner.login || null;

    e.htmlUrl = meta.html_url;
    e.description = meta.description ?? null;
    e.language = meta.language ?? null;

    const stars = meta.stargazers_count as number | undefined;
    e.stargazersCount = stars ?? null;

    e.createdAt = parseTime(meta.created_at);
    e.pushedAt = parseTime(meta.pushed_at);
    e.updatedAt = parseTime(meta.updated_at);

    if (prevStarsBefore == null && e.stargazersCount != null) {
        // 최초 수집
        e.previousStars = e.stargazersCount;
        e.growthRate = 0.0;
        e.trendScore = 0.0;
        if (e.trendStage == null) e.trendStage = 0;
    } else if (prevStarsBefore != null) {
        e.previousStars = prevStarsBefore;
    }

    return e;
}

function toJsDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  return null;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

// ──────────────────────────────────────────────────────────────
// score 계산 / stage update / candidate 승격
// ──────────────────────────────────────────────────────────────
async function evaluateTrendAndMaybePromote(e: GitHubRepoDoc): Promise<GitHubRepoDoc> {
  const now = new Date();

  const curr = orZero(e.stargazersCount ?? null);
  const prev = orZero(e.previousStars ?? null);

  // (A) 이번 실행에서의 "증가량"
  const deltaStarsRaw = curr - prev;
  const deltaStars = Math.max(0, deltaStarsRaw);

  // (B) "하루당 증가량"으로 안정화 (스케줄 지연/실패로 2~3일치 한 방에 들어오는 것 방지)
  const lastChecked = toJsDate((e as any).lastCheckedAt) ?? toJsDate((e as any).lastCrawledAt);
  const daysElapsed =
    lastChecked
      ? Math.max(1, (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60 * 24))
      : 1;

  const deltaPerDay = deltaStars / daysElapsed;

  // (1) 증가량 정규화 (포화형)
  // growthNorm ∈ [0, 1)
  const target = Math.max(1, TARGET_STARS_PER_DAY);
  let growthNorm = 0.0;
  if (deltaPerDay > 0) {
    growthNorm = 1.0 - Math.exp(-deltaPerDay / target);
    growthNorm = clamp(growthNorm, 0.0, 1.0);
  }

  // (2) 나이 페널티 (기존 유지): agePenaltyFactor ∈ (0, 1]
  let agePenaltyFactor = 1.0;
  const createdAt = toJsDate((e as any).createdAt);
  if (createdAt && AGE_HALF_LIFE_DAYS > 0) {
    const ageMs = now.getTime() - createdAt.getTime();
    const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
    agePenaltyFactor = Math.pow(0.5, ageDays / AGE_HALF_LIFE_DAYS);
    agePenaltyFactor = clamp(agePenaltyFactor, 0.0, 1.0);
  }

  // (3) 총 스타 페널티
  const pivot = Math.max(1, STAR_PIVOT_STARS);
  const alpha = Math.max(0, STAR_FACTOR_ALPHA);
  const denom = Math.max(1, curr);

  let starsFactor = Math.pow(pivot / denom, alpha);
  starsFactor = clamp(starsFactor, STAR_FACTOR_MIN, STAR_FACTOR_MAX);

  // (4) 최종 점수 (0~1) → (0~100)
  let score01 = growthNorm * agePenaltyFactor * starsFactor * GROWTH_WEIGHT * PENALTY_WEIGHT;
  score01 = clamp(score01, 0.0, 1.0);
  const score100 = score01 * 100.0;

  // (5) stage update (2회 연속 통과만 candidate 승격)
  const oldStage = e.trendStage ?? 0;
  let newStage = oldStage;

  if (oldStage === 0 || oldStage === 1) {
    if (score100 >= TREND_THRESHOLD) {
      newStage = Math.min(2, oldStage + 1); // 0->1, 1->2
    } else if (oldStage === 1) {
      newStage = 0; // 1회 통과했다가 다음날 실패하면 리셋
    }
  }

  const promotedTo2Now = oldStage < 2 && newStage === 2;

  // (6) 저장
  e.growthRate = prev > 0 ? (curr - prev) / prev : 0.0; 
  (e as any).deltaStars = deltaStars;         // 디버깅 편의(원하면 제거)
  (e as any).deltaPerDay = deltaPerDay;       
  (e as any).agePenaltyFactor = agePenaltyFactor; 
  (e as any).starsFactor = starsFactor;           

  e.trendScore = score100;
  e.trendStage = newStage;
  e.lastCheckedAt = now;
  e.previousStars = curr;

  // (7) 승격되면 candidates 테이블에 올리기 
  if (promotedTo2Now && e.id && e.fullName) {
    const candRef = db.collection(CANDIDATES_COL).doc(String(e.id));
    const snap = await candRef.get();
    if (!snap.exists) {
      const c: CandidateDoc = {
        repoId: e.id,
        fullName: e.fullName,
        promotedAt: now,
        givenToAI: false,
      };
      await candRef.set(c);
    }
  }

  return e;
}

// ──────────────────────────────────────────────────────────────
// 단일 리포 수집 및 평가 (upsertAndEvaluate)
// ──────────────────────────────────────────────────────────────

async function upsertAndEvaluate(fullName: string): Promise<GitHubRepoDoc | null> {
    const { owner, repo } = splitFullName(fullName);

    // 메타데이터 수집
    const { body: meta } = await githubGetJson(`/repos/${owner}/${repo}`);
    if (!meta) {
        return null;
    }

    const id = meta.id as number;
    const existing = await getRepoDocById(id);
    let e = mapMetaToRepoDoc(meta, existing);

    // README 수집
    e = await fetchAndAttachReadme(owner, repo, e);

    // 트렌드 계산/승급
    e = await evaluateTrendAndMaybePromote(e);

    // 크롤링 시간 기록
    e.lastCrawledAt = new Date();

    await saveRepoDoc(e);
    return e;
}

// ──────────────────────────────────────────────────────────────
// 전체 크롤 + 평가 (crawlAllAndEvaluate)
// ──────────────────────────────────────────────────────────────

async function crawlAllAndEvaluateInternal(): Promise<void> {
    const now = new Date();
    const sinceDate = new Date(now.getFullYear() - SEARCH_YEARS, now.getMonth(), now.getDate());

    const sinceStr = sinceDate.toISOString().slice(0, 10); // YYYY-MM-DD

    // created:>=YYYY-MM-DD
    const q = `stars:>=${MIN_STARS} created:>=${sinceStr}`;

    for (let page = 1; page <= MAX_PAGES; page++) { 
        try {
            const url = `/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${PER_PAGE}&page=${page}`;
            const { body: searchResult } = await githubGetJson(url);

            if (!searchResult) break;
            const items = searchResult.items as any[] | undefined;
            if (!items || items.length === 0) break;

            for (const item of items) {
                const fullName = item.full_name as string | undefined;
                if (!fullName) continue;
                try {
                    await upsertAndEvaluate(fullName);
                } catch (err) {
                    console.error("upsertAndEvaluate failed for", fullName, err);
                }
                if (SLEEP_MILLIS > 0) {
                    await sleep(SLEEP_MILLIS);
                }
            }
        } catch (err) {
            console.error("crawl page error", page, err);
            break;
        }
    }

    await dispatchCandidatesToAI(1);
}

// ──────────────────────────────────────────────────────────────
// AI 후보 조회 + givenToAI 표시
// ──────────────────────────────────────────────────────────────

async function getOldestUngivenCandidatesAndMark(limit: number): Promise<CandidateDoc[]> {
  const candSnap = await db.collection(CANDIDATES_COL)
    .where("givenToAI", "==", false)
    .orderBy("promotedAt", "asc")
    .limit(limit)
    .get();

  if (candSnap.empty) return [];
  return candSnap.docs.map(d => d.data() as CandidateDoc);
}

// ──────────────────────────────────────────────────────────────
// AI 연동
// ──────────────────────────────────────────────────────────────

const AI_ENDPOINT =
  "https://ai-production-9e83.up.railway.app/generate";

/**
 * repoDoc의 readmeText를 README.md "파일"로 만들어 AI 서버에 전송
 */
async function sendReadmeToAI(repo: GitHubRepoDoc): Promise<string | null> {
  if (!repo.readmeText || repo.readmeText.trim().length === 0) {
    console.log("[AI] skip: no README", repo.fullName);
    return null;
  }

  try {
    const payload = {
      readme: repo.readmeText,                 // README 원문 문자열 그대로
      repoName: repo.fullName ?? repo.name,    
      repoUrl: repo.htmlUrl,                   // GitHub URL
      stars: repo.stargazersCount ?? null,     // number
      language: repo.language ?? null,         // string
    };

    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[AI] request failed", repo.fullName, res.status, text);
      return null;
    }

    const json = (await res.json()) as any;

    
    const jobId = json?.jobId as string | undefined;
    if (!jobId) {
      console.error("[AI] no jobId in response", repo.fullName, json);
      return null;
    }

    console.log("[AI] job createddd", repo.fullName, jobId);
    return jobId;
  } catch (err) {
    console.error("[AI] sendReadmeToAI error", repo.fullName, err);
    return null;
  }
}

/**
 * givenToAI=false 후보를 limit개 givenToAI=true,
 * 각 후보의 README를 AI 서버로 전송
 */
async function dispatchCandidatesToAI(limit: number): Promise<void> {
  const cands = await getOldestUngivenCandidatesAndMark(limit);
  if (cands.length === 0) {
    console.log("[AI] no candidates to dispatch");
    return;
  }

  for (const c of cands) {
    const repo = await getRepoDocById(c.repoId);
    if (!repo) continue;

    const jobId = await sendReadmeToAI(repo);

    if (jobId) {
      await db.collection(CANDIDATES_COL).doc(String(c.repoId)).set({
        givenToAI: true,
        aiJobId: jobId,
        aiRequestedAt: new Date(),
      }, { merge: true });
    } else {
      // 실패 기록만 남기고 givenToAI는 false 유지
      await db.collection(CANDIDATES_COL).doc(String(c.repoId)).set({
        lastAiErrorAt: new Date(),
      }, { merge: true });
    }
  }
}




// ──────────────────────────────────────────────────────────────
// HTTP Functions
// ──────────────────────────────────────────────────────────────

// GET /api/github/ingest?fullName=owner/repo
export const ingest = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "GET") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const fullName = req.query.fullName as string | undefined;
            if (!fullName) {
                res.status(400).send("Missing fullName param");
                return;
            }

            const saved = await upsertAndEvaluate(fullName);
            if (!saved) {
                res.status(500).send(`failed: ${fullName}`);
                return;
            }

            const stage = saved.trendStage ?? 0;
            const score = saved.trendScore ?? 0.0;
            const growth = saved.growthRate ?? 0.0;

            res
                .status(200)
                .send(
                    `ingested: ${saved.fullName} (stage=${stage}, score=${score.toFixed(
                        4
                    )}, growth=${growth.toFixed(4)})`
                );
        } catch (err: any) {
            console.error("ingest error", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

// POST /api/github/force-candidate?fullName=owner/repo
// 강제 후보 등록(테스트용)
export const forceCandidate = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const fullName = req.query.fullName as string | undefined;
      if (!fullName) {
        res.status(400).send("Missing fullName param");
        return;
      }

      // 1) repo 메타+README까지 강제 수집/업데이트
      const repoDoc = await upsertAndEvaluate(fullName);
      if (!repoDoc || !repoDoc.id || !repoDoc.fullName) {
        res.status(500).send("Failed to ingest repo");
        return;
      }

      // 2) candidates에 강제 승격(테스트 목적)
      const candRef = db.collection(CANDIDATES_COL).doc(String(repoDoc.id));
      await candRef.set(
        {
          repoId: repoDoc.id,
          fullName: repoDoc.fullName,
          promotedAt: new Date(),
          givenToAI: false,
          forced: true,              // 테스트 표시(선택)
        } satisfies CandidateDoc & { forced: boolean },
        { merge: true }
      );

      res.status(200).send(`forced candidate: ${repoDoc.fullName}`);
    } catch (err) {
      console.error("forceCandidate error", err);
      res.status(500).send("Internal Server Error");
    }
  });
});


// POST /api/github/crawl  (Gen2, up to 1 hour)
export const crawl = onRequest(
  {
    timeoutSeconds: 3600,
    memory: "2GiB",         
    cors: true,
    region: "us-central1",   
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== "POST") {
          res.status(405).send("Method Not Allowed");
          return;
        }

        await crawlAllAndEvaluateInternal();

        res.status(200).send("crawl finished (see logs)");
      } catch (err: any) {
        console.error("crawl error", err);
        res.status(500).send("Internal Server Error");
      }
    });
  }
);

// GET /api/ai/candidates?limit=3
export const candidates = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "GET") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const limitParam = req.query.limit as string | undefined;
            let limit = Number(limitParam ?? "3");
            if (isNaN(limit) || limit <= 0) limit = 3;

            const repos = await getOldestUngivenCandidatesAndMark(limit);

            res.status(200).json(repos);
        } catch (err: any) {
            console.error("candidates error", err);
            res.status(500).send("Internal Server Error");
        }
    });
});



// POST /api/ai/dispatch?limit=9 (강제 테스트용)
export const dispatch = onRequest(
  { timeoutSeconds: 540, memory: "1GiB", cors: true },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const limitParam = req.query.limit as string | undefined;
      let limit = Number(limitParam ?? "9");
      if (isNaN(limit) || limit <= 0) limit = 9;

      await dispatchCandidatesToAI(limit);

      res.status(200).send(`dispatched ${limit} candidates to AI (see logs)`);
    } catch (err) {
      console.error("dispatch error", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

export async function sendReadmeToAI_Alt(repo: GitHubRepoDoc): Promise<string | null> {
    if (!repo.readmeText || repo.readmeText.trim().length === 0) {
        console.log("[AI_ALT] skip: no README", repo.fullName);
        return null;
    }

    try {
        const payload = {
            readme: repo.readmeText,
            repoName: repo.fullName ?? repo.name,
            repoUrl: repo.htmlUrl,
            stars: repo.stargazersCount ?? null,
            language: repo.language ?? null,
        };

        const res = await fetch("grateful-transformation-production-3484.up.railway.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("[AI_ALT] request failed", repo.fullName, res.status, text);
            return null;
        }

        const json = (await res.json()) as any;
        const jobId = json?.jobId as string | undefined;

        if (!jobId) {
            console.error("[AI_ALT] no jobId in response", repo.fullName, json);
            return null;
        }

        console.log("[AI_ALT] job created", repo.fullName, jobId);
        return jobId;
    } catch (err) {
        console.error("[AI_ALT] sendReadmeToAI_Alt error", repo.fullName, err);
        return null;
    }
}

// ──────────────────────────────────────────────────────────────
// Pub/Sub 스케줄링 (3일마다 전체 크롤)
// ──────────────────────────────────────────────────────────────

export const crawlScheduled = onSchedule(
  {
    schedule: "every 24 hours",
    region: "us-central1",
    timeoutSeconds: 3600,
    memory: "2GiB",
  },
  async () => {
    await crawlAllAndEvaluateInternal();
    await sendNewsletterForCompletedCandidates();
  }
);

// 스케쥴러 작동 테스트용
export const runScheduledNow = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 3600,
    memory: "2GiB",
    cors: true,
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      //await crawlAllAndEvaluateInternal();
      await sendNewsletterForCompletedCandidates();

      res.status(200).send("scheduled job ran (manual trigger)");
    } catch (e: any) {
      console.error("runScheduledNow error:", e);
      res.status(500).send(e?.message ?? "Internal Server Error");
    }
  }
);

// ──────────────────────────────────────────────────────────────
// AI 작업 완료된 후보 조회 및 뉴스레터 발송
// ──────────────────────────────────────────────────────────────


/**
 * AI 작업 완료된 후보들을 모아 뉴스레터를 발송합니다.
 * - promotedAt이 3일 이내인 문서들을 조회합니다.
 * - 해당 문서의 aiJobId를 사용해 comics 컬렉션에서 comicId와 summary를 찾습니다.
 */
async function getCompletedCandidates(limit: number): Promise<(CandidateDoc & { comicId: string, summary: string })[]> {
    const now = new Date();
    // 3일(72시간) 전 타임스탬프 계산
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

    // (1) promotedAt이 3일 이내인 후보 문서들을 조회합니다.
    // 아직 뉴스레터가 발송되지 않은 후보만 조회합니다.
    const candSnap = await db.collection(CANDIDATES_COL)
        .where("aiJobId", "!=", null)       // aiJobId가 있는 문서만 (AI 작업 요청된 것)
        .where("newsletterSentAt", "==", null) // 아직 뉴스레터가 발송되지 않은 것
        // 🚨 Firestore의 쿼리 제약 때문에 where("promotedAt", ">=", threeDaysAgo)와
        // orderBy("promotedAt", "asc")를 동시에 사용할 수 없습니다.
        // 여기서는 promotedAt으로 정렬하고 클라이언트에서 필터링합니다.
        .orderBy("promotedAt", "desc") // 최신 promotedAt 순서로 정렬 (클라이언트 필터링 효율 높임)
        .limit(limit * 2) // 필터링을 고려하여 넉넉하게 조회
        .get();

    if (candSnap.empty) return [];

    const candidatesToProcess: (CandidateDoc & { comicId: string, summary: string })[] = [];

    // (2) 클라이언트 측 필터링 및 AI 작업 완료 확인
    for (const doc of candSnap.docs) {
        const data = doc.data() as CandidateDoc & { aiJobId: string, [key: string]: any };
        const promotedAt = (data.promotedAt as any).toDate() as Date;

        // 3일 이내 승격된 문서만 처리
        if (promotedAt.getTime() < threeDaysAgo.getTime()) {
            continue;
        }

        if (!data.aiJobId) continue; // aiJobId가 없으면 스킵

        // (3) comics 컬렉션에서 aiJobId로 해당 만화 조회
        const comicSnap = await db.collection("comics")
            .where("aiJobId", "==", data.aiJobId)
            .limit(1)
            .get();

        if (comicSnap.empty) {
            // 아직 AI 작업이 완료되지 않았거나 comics 문서가 생성되지 않음
            continue;
        }

        const comicDoc = comicSnap.docs[0].data();
        const comicId = comicDoc.id as string; // comics 문서의 ID를 comicId로 사용

        // (4) summary(description)를 repos 컬렉션에서 조회
        const repoDoc = await db.collection("repos").doc(String(data.repoId)).get();
        const summary = repoDoc.exists ? (repoDoc.data()?.description ?? "A fascinating new comic.") : "A fascinating new comic.";


        // 모든 필수 정보를 가진 후보로 통합
        candidatesToProcess.push({
            ...data,
            comicId: comicId,
            summary: summary,
        });

        if (candidatesToProcess.length >= limit) {
            break;
        }
    }

    return candidatesToProcess;
}


async function tryLockCandidateForNewsletter(repoId: number, now: Date): Promise<boolean> {
  const ref = db.collection(CANDIDATES_COL).doc(String(repoId));
  const LOCK_MS = 30 * 60 * 1000; // 30분 락(실행 중 죽어도 재시도 가능하게)

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;

    const data = snap.data() as any;

    // 이미 발송 완료면 스킵
    if (data.newsletterSentAt != null) return false;

    // 다른 실행이 락을 잡고 있으면 스킵 (단, 오래된 락은 만료로 간주)
    const lockAt: Date | null = data.newsletterLockAt?.toDate?.() ?? null;
    if (lockAt && now.getTime() - lockAt.getTime() < LOCK_MS) {
      return false;
    }

    // 락 잡기 (처리중 표시)
    tx.update(ref, {
      newsletterLockAt: now,
      newsletterLockBy: "crawlScheduled/runScheduledNow",
    });

    return true;
  });
}

async function sendNewsletterForCompletedCandidates(): Promise<void> {
  const now = new Date();
  const completedCands = await getCompletedCandidates(20);

  if (completedCands.length === 0) {
    console.log("[Newsletter Dispatch] No completed candidates found.");
    return;
  }

  let processed = 0;

  for (const c of completedCands) {
    // 1) 락부터 시도 (중복발송 방지)
    const locked = await tryLockCandidateForNewsletter(c.repoId, now);
    if (!locked) {
      console.log("[Newsletter Dispatch] skip (locked or already sent):", c.fullName);
      continue;
    }

    const candRef = db.collection(CANDIDATES_COL).doc(String(c.repoId));

    // 2) 락 성공한 것만 메일 발송
    try {
      await sendNewsletterInternal({
        fullName: c.fullName,
        comicId: c.comicId,
        summary: c.summary,
      });

      // 3) 성공 기록 + 락 해제
      await candRef.set(
        {
          newsletterSentAt: now,
          newsletterSendSuccess: true,
          newsletterLockAt: admin.firestore.FieldValue.delete(),
          newsletterLockBy: admin.firestore.FieldValue.delete(),
        },
        { merge: true }
      );

      processed++;
    } catch (err) {
      console.error(`[Newsletter Dispatch] Failed to send for ${c.fullName}`, err);

      // 4) 실패 기록 + 락 해제(재시도 가능)
      await candRef.set(
        {
          newsletterSentAt: now,
          newsletterSendSuccess: false,
          lastNewsletterError: (err as Error)?.message ?? String(err),
          newsletterLockAt: admin.firestore.FieldValue.delete(),
          newsletterLockBy: admin.firestore.FieldValue.delete(),
        },
        { merge: true }
      );
    }
  }

  console.log(`[Newsletter Dispatch] Finished. sent/attempted = ${processed}/${completedCands.length}`);
}