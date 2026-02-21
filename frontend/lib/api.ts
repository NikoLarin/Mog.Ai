import type { AnalyzeRequest, VanityAdvisorResponse } from "@/types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function analyzePhotos(payload: AnalyzeRequest): Promise<VanityAdvisorResponse> {
  const formData = new FormData();

  payload.images.forEach((file) => formData.append("images", file));

  if (payload.height_cm) formData.append("height_cm", payload.height_cm);
  if (payload.weight_kg) formData.append("weight_kg", payload.weight_kg);
  if (payload.age) formData.append("age", payload.age);
  if (payload.gender) formData.append("gender", payload.gender);
  if (payload.goals) formData.append("goals", payload.goals);

  const response = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    let message = "Failed to analyze photos.";
    try {
      const error = (await response.json()) as { detail?: string };
      if (error.detail) message = error.detail;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return (await response.json()) as VanityAdvisorResponse;
}
