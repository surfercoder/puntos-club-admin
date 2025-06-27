import type { Redemption } from './redemption';
import type { History } from './history';

export type AppOrder = {
  id: string;
  order_number: string;
  creation_date: string;
  total_points: number;
  observations?: string | null;
};

export type AppOrderWithRelations = AppOrder & {
  redemptions?: Redemption[];
  history?: History[];
};
