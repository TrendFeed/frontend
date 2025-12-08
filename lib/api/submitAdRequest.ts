
import { apiRequest } from "@/lib/api/client";

export interface AdRequestPayload {
  githubUrl: string;
  highlight: string;
  duration: string;
}

export interface AdRequestResponse {
  success: boolean;
  message: string;
  id?: string;
}

export const submitAdRequest = async (
  payload: AdRequestPayload
): Promise<AdRequestResponse> => {
  return apiRequest<AdRequestResponse>("/submitAdRequest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};