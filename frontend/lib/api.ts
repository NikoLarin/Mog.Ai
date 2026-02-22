import type { AnalyzeRequest, PreviewReportResponse, VanityAdvisorResponse } from "@/types/analysis";

const ENV_API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL;

export const API_BASE =
  ENV_API_BASE && ENV_API_BASE.trim().length > 0
    ? ENV_API_BASE
    : process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:8000";

export function getApiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error(
      "Missing backend URL. Set NEXT_PUBLIC_BACKEND_URL (preferred) or NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_URL."
    );
  }

  const normalizedBase = API_BASE.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function parseError(response: Response): Promise<never> {
  let message = "Request failed.";
  try {
    const error = (await response.json()) as { detail?: string };
    if (error.detail) message = error.detail;
  } catch {
    // keep fallback
  }
  throw new Error(message);
}

export async function prepareScan(payload: AnalyzeRequest): Promise<{ scan_id: string; image_count: number; message: string }> {
  const formData = new FormData();
  payload.images.forEach((file) => formData.append("images", file));

  if (payload.height_cm) formData.append("height_cm", payload.height_cm);
  if (payload.weight_kg) formData.append("weight_kg", payload.weight_kg);
  if (payload.height_ft) formData.append("height_ft", payload.height_ft);
  if (payload.height_in) formData.append("height_in", payload.height_in);
  if (payload.weight_lbs) formData.append("weight_lbs", payload.weight_lbs);
  if (payload.age) formData.append("age", payload.age);
  if (payload.gender) formData.append("gender", payload.gender);
  if (payload.goals) formData.append("goals", payload.goals);

  const url = getApiUrl("/api/v1/scans/prepare");
  console.log("DEBUG: Fetching prepareScan at", url);
  const response = await fetch(url, { method: "POST", mode: "cors", body: formData });
  if (!response.ok) await parseError(response);
  return (await response.json()) as { scan_id: string; image_count: number; message: string };
}

export async function getPreview(scanId: string): Promise<PreviewReportResponse> {
  const url = getApiUrl(`/api/v1/scans/${scanId}/preview`);
  console.log("DEBUG: Fetching getPreview at", url);
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) await parseError(response);
  return (await response.json()) as PreviewReportResponse;
}

export async function createCheckout(scanId: string): Promise<{ session_id: string; publishable_key: string }> {
  const url = getApiUrl("/api/v1/payments/create-checkout");
  console.log("DEBUG: Fetching createCheckout at", url);
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_id: scanId })
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as { session_id: string; publishable_key: string };
}

export async function analyzePaid(scanId: string, stripeSessionId: string): Promise<VanityAdvisorResponse> {
  const url = getApiUrl("/api/v1/analyze-paid");
  console.log("DEBUG: Fetching analyzePaid at", url);
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_id: scanId, stripe_session_id: stripeSessionId })
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as VanityAdvisorResponse;
}
