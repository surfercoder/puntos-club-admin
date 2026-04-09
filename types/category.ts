export type Category = {
  id?: string;
  organization_id?: string;
  parent_id?: string | null;
  name: string;
  description?: string | null;
  active: boolean;
};

