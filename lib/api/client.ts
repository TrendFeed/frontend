"use client";

import { getIdToken } from "@/lib/firebase/auth";

// 🔥 1) Cloud Functions 기본 엔드포인트 설정
// 배포 후 실제 URL로 변경하는 것을 권장
// 예: https://asia-northeast3-trendfeed-cb56b.cloudfunctions.net
const DEFAULT_BASE_URL =
    process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:5001/trendfeed-cb56b/asia-northeast3" // Firebase Emulator용
        : "https://us-central1-trendfeed-cb56b.cloudfunctions.net"; // 실제 Functions URL

// 🔥 2) NEXT_PUBLIC_API_URL을 우선함, 없으면 DEFAULT_BASE_URL 사용
export const API_BASE_URL =
    (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

// -------------------------------------------------------------

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
}

// -------------------------------------------------------------

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<T> {
  const { auth, headers, ...rest } = options;

  // 🔥 path 앞에 꼭 "/" 붙도록 보정
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const requestHeaders = new Headers(headers || {});
  requestHeaders.set("Accept", "application/json");

  if (rest.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = await getIdToken();
    if (!token) {
      throw new ApiError("Authentication required", 401);
    }
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...rest,
    headers: requestHeaders,
  });

  const responseText = await response.text();
  const json = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const message =
        json?.error || json?.message || `Request failed with ${response.status}`;
    throw new ApiError(message, response.status, json);
  }

  // Firebase Functions 일부가 { success: true, data: ... } 형태일 때
  if (json && typeof json === "object" && "success" in json) {
    if (json.success) {
      return json.data as T;
    }
    throw new ApiError(json.error || "Unknown API error", response.status, json);
  }

  return json as T;
}
