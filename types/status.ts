export type Status = {
  id: string;
  name: string;
  description?: string | null;
  is_terminal: boolean;
  order_num: number;
};
