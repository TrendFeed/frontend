"use client";

import { getIdToken } from "@/lib/firebase/auth";

/**
 * TODO: Restore the localhost backend once the real API is ready again.
 */
// const DEFAULT_BASE_URL = "http://localhost:8080";

export const API_BASE_URL = "";

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

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { auth, headers, ...rest } = options;
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

  /**
   * TODO: Re-enable the fetch call below when backend responses are available.
   */
  // const response = await fetch(`${API_BASE_URL}${path}`, {
  //   ...rest,
  //   headers: requestHeaders,
  // });
  // const responseText = await response.text();
  // const json = responseText ? JSON.parse(responseText) : null;
  // if (!response.ok) {
  //   const message =
  //     json?.error || json?.message || `Request failed with ${response.status}`;
  //   throw new ApiError(message, response.status, json);
  // }
  // if (json && typeof json === "object" && "success" in json) {
  //   if (json.success) {
  //     return json.data as T;
  //   }
  //   throw new ApiError(
  //     json.error || "Unknown API error",
  //     response.status,
  //     json
  //   );
  // }
  // return json as T;

  throw new ApiError(
    "API calls are disabled while we rely on mock data for the demo."
  );
}
