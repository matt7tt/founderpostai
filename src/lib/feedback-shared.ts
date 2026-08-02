export const FEEDBACK_CATEGORIES = ['bug', 'feature', 'feedback'] as const;
export const FEEDBACK_PRODUCTS = ['core', 'seo', 'seo-pro'] as const;
export const FEEDBACK_STATUSES = ['new', 'reviewing', 'planned', 'resolved', 'spam'] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackProduct = (typeof FEEDBACK_PRODUCTS)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface FeedbackInput {
  category: FeedbackCategory;
  product: FeedbackProduct;
  message: string;
  contact_email: string;
  plugin_version: string;
  core_version: string;
  wp_version: string;
  php_version: string;
}

export interface FeedbackRecord extends FeedbackInput {
  id: string;
  site_id: string;
  site_url: string;
  status: FeedbackStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}
