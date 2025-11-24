// functions/src/github.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as functions from "firebase-functions";
import cors from "cors";

import {
    db,
    GITHUB_TOKEN,
    GITHUB_API_BASE,
    REPOS_COL,
    CANDIDATES_COL,
    GROWTH_K,
    SEARCH_YEARS,
    MIN_STARS,
    MAX_PAGES,
    PER_PAGE,
    SLEEP_MILLIS,
    AGE_HALF_LIFE_DAYS,
    GROWTH_WEIGHT,
    PENALTY_WEIGHT,
    TREND_THRESHOLD,
} from "./config";

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
    createdAt?: Date | null;
    pushedAt?: Date | null;
    updatedAt?: Date | null;

    previousStars?: number | null;
    growthRate?: number | null;
    trendScore?: number | null;
    trendStage?: number | null;

    lastCrawledAt?: Date | null;
    lastCheckedAt?: Date | null;

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

// ──────────────────────────────────────────────────────────────
// score 계산 / stage update / candidate 승격
// ──────────────────────────────────────────────────────────────

async function evaluateTrendAndMaybePromote(e: GitHubRepoDoc): Promise<GitHubRepoDoc> {
    const curr = orZero(e.stargazersCount ?? null);
    const prev = orZero(e.previousStars ?? null);

    let growthRate = 0.0;
    if (prev > 0) {
        growthRate = (curr - prev) / prev;
    }

    let growthNorm = 0.0;
    if (growthRate > 0.0) {
        growthNorm = 1.0 - Math.exp(-GROWTH_K * growthRate);
        if (growthNorm < 0.0) growthNorm = 0.0;
        if (growthNorm > 1.0) growthNorm = 1.0;
    }

    let agePenaltyFactor = 1.0;
    if (e.createdAt && AGE_HALF_LIFE_DAYS > 0) {
        const now = new Date();
        const ageMs = now.getTime() - e.createdAt.getTime();
        const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
        agePenaltyFactor = Math.pow(0.5, ageDays / AGE_HALF_LIFE_DAYS);
        if (agePenaltyFactor < 0.0) agePenaltyFactor = 0.0;
        if (agePenaltyFactor > 1.0) agePenaltyFactor = 1.0;
    }

    let score01 = growthNorm * agePenaltyFactor * GROWTH_WEIGHT * PENALTY_WEIGHT;
    if (score01 < 0.0) score01 = 0.0;
    if (score01 > 1.0) score01 = 1.0;

    const score100 = score01 * 100.0;

    const oldStage = e.trendStage ?? 0;
    let newStage = oldStage;

    if (oldStage === 0 || oldStage === 1) {
        if (score100 >= TREND_THRESHOLD) {
            newStage = Math.min(2, oldStage + 1);
        } else if (oldStage === 1) {
            newStage = 0; // 강등
        }
    }

    const promotedTo2Now = oldStage < 2 && newStage === 2;

    e.growthRate = growthRate;
    e.trendScore = score100;
    e.trendStage = newStage;
    e.lastCheckedAt = new Date();
    e.previousStars = curr;

    // 승격되면 candidates 테이블에 올리기
    if (promotedTo2Now && e.id && e.fullName) {
        const candRef = db.collection(CANDIDATES_COL).doc(String(e.id));
        const snap = await candRef.get();
        if (!snap.exists) {
            const now = new Date();
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
    const q = `stars:>=${MIN_STARS}+created:>=${sinceStr}`;

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

async function getOldestUngivenCandidatesAndMark(limit: number): Promise<GitHubRepoDoc[]> {
    if (limit <= 0) limit = 1;

    const candSnap = await db
        .collection(CANDIDATES_COL)
        .where("givenToAI", "==", false)
        .orderBy("promotedAt", "asc")
        .limit(limit)
        .get();

    if (candSnap.empty) {
        return [];
    }

    const candidateDocs: CandidateDoc[] = [];
    candSnap.forEach((doc) => {
        candidateDocs.push(doc.data() as CandidateDoc);
    });

    // 주는 것으로 표시
    const batch = db.batch();
    candSnap.docs.forEach((docRef) => {
        batch.update(docRef.ref, { givenToAI: true });
    });
    await batch.commit();

    // 실제 repo 로딩
    const results: GitHubRepoDoc[] = [];
    for (const c of candidateDocs) {
        const repoDoc = await getRepoDocById(c.repoId);
        if (repoDoc) results.push(repoDoc);
    }

    return results;
}

// ──────────────────────────────────────────────────────────────
// AI 연동
// ──────────────────────────────────────────────────────────────

const AI_ENDPOINT =
  "https://ai-production-9e83.up.railway.app";

/**
 * repoDoc의 readmeText를 README.md "파일"로 만들어 AI 서버에 전송
 */
async function sendReadmeToAI(repo: GitHubRepoDoc): Promise<string | null> {
  if (!repo.readmeText || repo.readmeText.trim().length === 0) {
    console.log("[AI] skip: no README", repo.fullName);
    return null;
  }

  try {
    const form = new FormData();
    const blob = new Blob([repo.readmeText], { type: "text/markdown; charset=utf-8" });

    // 필드명 'file', 파일명 'README.md'
    form.append("file", blob, "README.md");

    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[AI] request failed", repo.fullName, res.status, text);
      return null;
    }

    const json = (await res.json()) as any;
    const jobId = json?.job_id as string | undefined;

    if (!jobId) {
      console.error("[AI] no job_id in response", repo.fullName, json);
      return null;
    }

    console.log("[AI] job created", repo.fullName, jobId);
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
  const repos = await getOldestUngivenCandidatesAndMark(limit);

  if (repos.length === 0) {
    console.log("[AI] no candidates to dispatch");
    return;
  }

  for (const repo of repos) {
    try {
      const jobId = await sendReadmeToAI(repo);

      if (jobId && repo.id) {
        await db.collection(CANDIDATES_COL).doc(String(repo.id)).set(
          {
            aiJobId: jobId,
            aiRequestedAt: new Date(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("[AI] dispatch failed for", repo.fullName, err);
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


// POST /api/github/crawl
export const crawl = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            await crawlAllAndEvaluateInternal();

            res.status(200).send("crawl started and finished (see logs)");
        } catch (err: any) {
            console.error("crawl error", err);
            res.status(500).send("Internal Server Error");
        }
    });
});

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

// POST /api/ai/dispatch?limit=9
// 강제 테스트용
export const dispatch = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
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
  });
});


// ──────────────────────────────────────────────────────────────
// Pub/Sub 스케줄링 (3일마다 전체 크롤)
// ──────────────────────────────────────────────────────────────

export const crawlScheduled = onSchedule("every 72 hours", async (event) => {
    console.log("Scheduled crawl started");
    await crawlAllAndEvaluateInternal();
    console.log("Scheduled crawl finished");
});
