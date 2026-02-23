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


export interface PreviewReportResponse {
  summary: string;
  strengths: string[];
  hidden_insights_count: number;
  tease_line: string;
}


export interface PromoValidationResponse {
  valid: boolean;
  promo_code: string;
  coupon_name: string | null;
  discount_display: string;
}
