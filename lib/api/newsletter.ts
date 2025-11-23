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
