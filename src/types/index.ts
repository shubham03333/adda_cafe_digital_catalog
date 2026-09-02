export type AnalyticsEvent =
  | "qr_scan"
  | "rating"
  | "feedback_submitted"
  | "review_generated"
  | "review_generation_failed"
  | "copy_click"
  | "use_review"
  | "google_click"
  | "review_selected"
  | "menu_sync"
  | "menu_sync_failed"
  | "pos_api_error"
  | "order_placed"
  | "order_status_updated"
  | "webhook_failed";

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
