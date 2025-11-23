"use client";

import { apiRequest } from "@/lib/api/client";

export type NewsletterStatus =
  | "pending"
  | "active"
  | "unsubscribed"
  | "invalid"
  | "error"
  | string;

export interface NewsletterResponse {
  success: boolean;
  status: NewsletterStatus;
  message: string;
  error?: string;
}

export const subscribeToNewsletter = async (
  email: string
): Promise<NewsletterResponse> => {
  return apiRequest<NewsletterResponse>("/newsletterSubscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const confirmNewsletterSubscription = async (
  token: string
): Promise<NewsletterResponse> => {
  return apiRequest<NewsletterResponse>(
    `/newsletterConfirm?token=${encodeURIComponent(token)}`,
    { method: "GET" }
  );
};

export const unsubscribeNewsletter = async (
  email: string,
  token: string
): Promise<NewsletterResponse> => {
  return apiRequest<NewsletterResponse>("/newsletterUnsubscribe", {
    method: "POST",
    body: JSON.stringify({ email, token }),
  });
};
