export type Confidence = "low" | "medium" | "high";

export interface BodyFatEstimate {
  percentage: number | null;
  confidence: Confidence;
  range: string;
}

export interface VanityAdvisorResponse {
  overall_aesthetic_summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  body_fat_estimate: BodyFatEstimate;
  key_ratings: Record<string, number>;
  personalized_roadmap: string[];
  style_tips: string[];
  safety_notes: string;
  disclaimer: string;
  limitations: string[];
}

export interface AnalyzeRequest {
  images: File[];
  height_cm?: string;
  weight_kg?: string;
  age?: string;
  gender?: string;
  goals?: string;
}
