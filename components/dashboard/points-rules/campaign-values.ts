/** Forma y valores iniciales del formulario de campañas. Viven aparte del
 *  componente porque las páginas del servidor arman el estado inicial y no
 *  tienen por qué arrastrar el JSX del formulario. */

export const ASSIGNMENT_TYPES = ["fixed_per_sale", "percentage"] as const;
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

export type CampaignBranch = { id: string; name: string };

export type CampaignFormValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  timeStart: string;
  timeEnd: string;
  assignment: AssignmentType;
  /** Puntos planos por venta cuando el tipo es `fixed_per_sale`. */
  points: string;
  percentage: string;
  /** Vacío = todas las sucursales. */
  branchIds: string[];
};

export const EMPTY_CAMPAIGN: CampaignFormValues = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  daysOfWeek: [],
  timeStart: "",
  timeEnd: "",
  assignment: "fixed_per_sale",
  points: "",
  percentage: "",
  branchIds: [],
};
