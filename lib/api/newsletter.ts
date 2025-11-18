"use client";

import { apiRequest } from "@/lib/api/client";

interface NewsletterResponse {
  email: string;
  status: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
}

export const subscribeToNewsletter = async (
  email: string
): Promise<NewsletterResponse> => {
  return apiRequest<NewsletterResponse>("/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const confirmNewsletterSubscription = async (
  token: string
): Promise<NewsletterResponse> => {
  return apiRequest<NewsletterResponse>(
    `/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
    { method: "GET" }
  );
};

export const unsubscribeNewsletter = async (
  email: string,
  token: string
): Promise<NewsletterResponse> => {
  return apiRequest<NewsletterResponse>("/api/newsletter/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ email, token }),
  });
};
