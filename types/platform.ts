export type PlatformMessage = {
  id: number;
  organization_id: number;
  sender_id: number;
  from_platform: boolean;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: { first_name: string | null; last_name: string | null } | null;
  organization?: { name: string } | null;
};

export type PlatformBroadcast = {
  id: number;
  created_by: number;
  title: string;
  body: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
};
