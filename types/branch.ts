export type Branch = {
  id: string;
  organization_id: string;
  address_id?: string | null;
  name: string;
  phone?: string | null;
  active: boolean;
};
