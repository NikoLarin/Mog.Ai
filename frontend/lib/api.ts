import type { AnalyzeRequest, PreviewReportResponse, VanityAdvisorResponse } from "@/types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

  const response = await fetch(`${API_BASE}/api/v1/scans/prepare`, { method: "POST", body: formData });
  if (!response.ok) await parseError(response);
  return (await response.json()) as { scan_id: string; image_count: number; message: string };
}

export async function getPreview(scanId: string): Promise<PreviewReportResponse> {
  const response = await fetch(`${API_BASE}/api/v1/scans/${scanId}/preview`);
  if (!response.ok) await parseError(response);
  return (await response.json()) as PreviewReportResponse;
}

export async function createCheckout(scanId: string): Promise<{ session_id: string; publishable_key: string }> {
  const response = await fetch(`${API_BASE}/api/v1/payments/create-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_id: scanId })
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as { session_id: string; publishable_key: string };
}

export async function analyzePaid(scanId: string, stripeSessionId: string): Promise<VanityAdvisorResponse> {
  const response = await fetch(`${API_BASE}/api/v1/analyze-paid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_id: scanId, stripe_session_id: stripeSessionId })
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as VanityAdvisorResponse;
}
