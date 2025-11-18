"use client";

import { apiRequest } from "@/lib/api/client";
import { Comic, PaginatedResult, UserProfile } from "@/lib/types";
import { ComicApiResponse, mapComicResponse } from "@/lib/api/comics";

interface PaginatedComicResponse {
  data: ComicApiResponse[];
  pagination: PaginatedResult<Comic>["pagination"];
}

export interface UpdateProfilePayload {
  displayName?: string;
  preferences?: {
    interests?: string[];
    notifications?: Record<string, boolean>;
    comicStyle?: string;
  };
}

export const verifyUserSession = async (): Promise<UserProfile> => {
  return apiRequest<UserProfile>("/api/auth/verify", {
    method: "POST",
    auth: true,
  });
};

export const getUserProfile = async (): Promise<UserProfile> => {
  return apiRequest<UserProfile>("/api/user/profile", {
    method: "GET",
    auth: true,
  });
};

export const updateUserProfile = async (
  payload: UpdateProfilePayload
): Promise<UserProfile> => {
  return apiRequest<UserProfile>("/api/user/profile", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
};

export const getSavedComics = async ({
  page = 1,
  limit = 50,
  signal,
}: { page?: number; limit?: number; signal?: AbortSignal } = {}): Promise<
  PaginatedResult<Comic>
> => {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await apiRequest<PaginatedComicResponse>(
    `/api/user/saved?${searchParams.toString()}`,
    { method: "GET", auth: true, signal }
  );

  return {
    data: response.data.map(mapComicResponse),
    pagination: response.pagination,
  };
};

export const saveComic = async (comicId: number): Promise<void> => {
  await apiRequest("/api/user/saved", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ comicId }),
  });
};

export const unsaveComic = async (comicId: number): Promise<void> => {
  await apiRequest(`/api/user/saved/${comicId}`, {
    method: "DELETE",
    auth: true,
  });
};
