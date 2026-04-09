export type PushNotificationStatus = 'draft' | 'sending' | 'sent' | 'failed';

export type PushNotification = {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sent_count: number;
  failed_count: number;
  status: PushNotificationStatus;
  moderation_approved: boolean;
  moderation_content_hash?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

