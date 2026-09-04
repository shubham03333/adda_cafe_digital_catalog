import { posApiKey, posBaseUrl } from "@/lib/pos/config";
import { trackEvent } from "@/lib/analytics";

export class PosApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "PosApiError";
  }
}

export async function posFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = posBaseUrl();
  const key = posApiKey();
  if (!base || !key) {
    throw new PosApiError("POS integration is not configured");
  }

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    void trackEvent("pos_api_error", {
      path,
      status: response.status,
      error: data.error ?? "request failed",
    });
    throw new PosApiError(data.error || `POS request failed (${response.status})`, response.status);
  }
  return data;
}
