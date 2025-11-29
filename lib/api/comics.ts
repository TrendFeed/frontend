"use client";

import { apiRequest } from "@/lib/api/client";
import { Comic, PaginatedResult, PaginationInfo } from "@/lib/types";

export interface ComicApiResponse {
  id: number;
  repoName: string;
  repoUrl: string;
  stars: number;
  language: string;
  panels: unknown;
  keyInsights: string;
  isNew: boolean;
  likes: number;
  shares: number;
  comments: number;
  createdAt: string;
  savedAt?: string;
}

interface PaginatedComicResponse {
  data: ComicApiResponse[];
  pagination: PaginationInfo;
}

const normalizePanels = (panels: unknown): string[] => {
  if (!Array.isArray(panels)) {
    return [];
  }

  return panels
    .map((panel) => {
      if (typeof panel === "string") return panel;
      if (panel && typeof panel === "object") {
        const panelRecord = panel as Record<string, unknown>;
        const candidate =
          panelRecord.imageUrl ||
          panelRecord.url ||
          panelRecord.image ||
          panelRecord.src;
        return typeof candidate === "string" ? candidate : undefined;
      }
      return undefined;
    })
    .filter((value): value is string => Boolean(value));
};

export const mapComicResponse = (payload: ComicApiResponse): Comic => ({
  id: payload.id,
  repoName: payload.repoName,
  repoUrl: payload.repoUrl,
  stars: payload.stars ?? 0,
  language: payload.language || "Unknown",
  panels: normalizePanels(payload.panels),
  keyInsights:  payload.keyInsights,
  isNew: Boolean(payload.isNew),
  likes: payload.likes ?? 0,
  shares: payload.shares ?? 0,
  comments: payload.comments ?? 0,
  createdAt: payload.createdAt,
  savedAt: payload.savedAt,
});

const toPaginatedResult = (
  payload: PaginatedComicResponse
): PaginatedResult<Comic> => ({
  data: payload.data.map(mapComicResponse),
  pagination: payload.pagination,
});

export interface FetchComicsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  signal?: AbortSignal;
}

export const fetchComics = async ({
  page = 1,
  limit = 20,
  sortBy = "latest",
  signal,
}: FetchComicsParams = {}): Promise<PaginatedResult<Comic>> => {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
  });

  const result = await apiRequest<PaginatedComicResponse>(
    `/getComics?${searchParams.toString()}`,
    { method: "GET", signal }
  );

  return toPaginatedResult(result);
};

export const fetchComicsByLanguage = async (
  language: string,
  {
    page = 1,
    limit = 20,
    signal,
  }: { page?: number; limit?: number; signal?: AbortSignal } = {}
): Promise<PaginatedResult<Comic>> => {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    language,
  });

  const result = await apiRequest<PaginatedComicResponse>(
    `/getComicsByLanguage?${searchParams.toString()}`,
    { method: "GET", signal }
  );

  return toPaginatedResult(result);
};

export const fetchNewComics = async ({
  page = 1,
  limit = 20,
  signal,
}: { page?: number; limit?: number; signal?: AbortSignal } = {}): Promise<
  PaginatedResult<Comic>
> => {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const result = await apiRequest<PaginatedComicResponse>(
    `/getNewComics?${searchParams.toString()}`,
    { method: "GET", signal }
  );

  return toPaginatedResult(result);
};

export const fetchComicById = async (
  id: number,
  signal?: AbortSignal
): Promise<Comic> => {
  const params = new URLSearchParams({ id: id.toString() });
  const result = await apiRequest<ComicApiResponse>(`/getComicById?${params.toString()}`, {
    method: "GET",
    signal,
  });
  return mapComicResponse(result);
};

export const likeComic = async (id: number): Promise<void> => {
  await apiRequest(`/likeComic`, {
    method: "POST",
    body: JSON.stringify({ comicId: id }),
  });
};

export const shareComic = async (id: number): Promise<void> => {
  await apiRequest(`/shareComic`, {
    method: "POST",
    body: JSON.stringify({ comicId: id }),
  });
};
