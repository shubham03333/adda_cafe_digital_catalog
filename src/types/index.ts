export type AnalyticsEvent =
  | "qr_scan"
  | "rating"
  | "feedback_submitted"
  | "review_generated"
  | "review_generation_failed"
  | "copy_click"
  | "use_review"
  | "google_click"
  | "review_selected";

export type ReviewSuggestion = {
  id: string;
  text: string;
};

export type CafeSettings = {
  id: string;
  cafe_id: string;
  cafe_name: string;
  google_review_url: string;
  table_count: number;
  updated_at: string;
};
