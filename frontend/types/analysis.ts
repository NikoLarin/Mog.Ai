export type Confidence = "high" | "medium" | "low";

export interface BodyFatEstimate {
  percentage: number;
  range: string | null;
  confidence: Confidence;
}

export interface VanityAdvisorResponse {
  overall_aesthetic_summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  body_fat_estimate: BodyFatEstimate;
  key_ratings: Record<string, number> | null;
  personalized_steps: string[];
  limitations: string[];
}

export interface AnalyzeRequest {
  images: File[];
  height_cm?: string;
  weight_kg?: string;
  height_ft?: string;
  height_in?: string;
  weight_lbs?: string;
  age?: string;
  gender?: string;
  goals?: string;
}
