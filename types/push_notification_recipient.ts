import type { Beneficiary } from './beneficiary';
import type { PushToken } from './push_token';
import type { PushNotification } from './push_notification';

export type PushNotificationRecipientStatus = 'pending' | 'sent' | 'failed' | 'read';

export type PushNotificationRecipient = {
  id: string;
  push_notification_id: string;
  beneficiary_id: string;
  push_token_id?: string | null;
  status: PushNotificationRecipientStatus;
  error_message?: string | null;
  sent_at?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PushNotificationRecipientWithRelations = PushNotificationRecipient & {
  push_notification?: PushNotification;
  beneficiary?: Beneficiary;
  push_token?: PushToken;
};
