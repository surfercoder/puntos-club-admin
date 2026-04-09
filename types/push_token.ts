export type PushToken = {
  id: string;
  beneficiary_id: string;
  expo_push_token: string;
  device_id?: string | null;
  platform?: 'ios' | 'android' | 'web' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

