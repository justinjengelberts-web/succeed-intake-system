export interface ExtractedData {
  sender_type:
    | "programme_provider"
    | "school"
    | "student"
    | "organisation"
    | "spam"
    | "unknown";
  sender_name: string | null;
  contact_info: {
    email: string | null;
    name: string | null;
    role: string | null;
  };
  programme: {
    name: string | null;
    type:
      | "summer_school"
      | "bootcamp"
      | "academic"
      | "enrichment"
      | "other"
      | null;
    subject: string | null;
    location: string | null;
    fee: number | null;
    fee_currency: string | null;
    audience_age_min: number | null;
    audience_age_max: number | null;
    audience_description: string | null;
  };
  intent: string | null;
  is_spam: boolean;
  completeness_flags: {
    has_contact_info: boolean;
    has_programme_details: boolean;
    has_audience: boolean;
    has_pricing: boolean;
    has_clear_intent: boolean;
  };
}

export interface ScoreBreakdown {
  completeness: number;
  value_signals: number;
  platform_fit: number;
  intent_clarity: number;
  total: number;
  factors: string[];
}

export type Action = "schedule_call" | "request_info" | "manual_review" | "archive";

export interface RouteResult {
  action: Action;
  priority_label: "high" | "medium" | "low" | "none";
  reason: string;
}

export interface PipelineResult {
  enquiry_id: string;
  raw_input: string;
  extracted: ExtractedData;
  score: ScoreBreakdown;
  route: RouteResult;
  follow_up: string | null;
  processing_time_ms: number;
}

export interface StepLog {
  enquiry_id: string;
  step: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
  error: string | null;
}
