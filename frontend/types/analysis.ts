export type Confidence = "low" | "medium" | "high";

export interface Insight {
  score: number | null;
  confidence: Confidence;
  observations: string[];
  quick_wins: string[];
  cautions: string[];
}

export interface BodyFatEstimate {
  bf_estimate_percent: number | null;
  confidence: Confidence;
  estimated_range: string;
  rationale: string[];
}

export interface SafetyAndLimitations {
  disclaimer: string;
  safety_notes: string[];
  limitations: string[];
}

export interface VanityAdvisorResponse {
  bf_estimate: BodyFatEstimate;
  eyebrow: Insight;
  neck_and_posture: Insight;
  symmetry_and_skin: Insight;
  glow_up_roadmap: string[];
  safety_and_limitations: SafetyAndLimitations;
}

export interface AnalyzeRequest {
  images: File[];
  height_cm?: string;
  weight_kg?: string;
  age?: string;
  gender?: string;
  goals?: string;
}
