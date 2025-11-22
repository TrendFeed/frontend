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
  return apiRequest<UserProfile>("/verifyUserSession", {
    method: "POST",
    auth: true,
  });
};

export const getUserProfile = async (): Promise<UserProfile> => {
  return apiRequest<UserProfile>("/getUserProfile", {
    method: "GET",
    auth: true,
  });
};

export const updateUserProfile = async (
  payload: UpdateProfilePayload
): Promise<UserProfile> => {
  return apiRequest<UserProfile>("/updateUserProfile", {
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
    `/getSavedComics?${searchParams.toString()}`,
    { method: "GET", auth: true, signal }
  );

  return {
    data: response.data.map(mapComicResponse),
    pagination: response.pagination,
  };
};

export const saveComic = async (comicId: number): Promise<void> => {
  await apiRequest("/saveUserComic", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ comicId }),
  });
};

export const unsaveComic = async (comicId: number): Promise<void> => {
  await apiRequest(`/removeSavedComic`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ comicId }),
  });
};
