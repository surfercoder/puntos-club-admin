import type { Organization } from './organization';
import type { AppUser } from './app_user';

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
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PushNotificationWithRelations = PushNotification & {
  organization?: Organization;
  creator?: AppUser;
};
