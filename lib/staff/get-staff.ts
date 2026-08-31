import { getActiveOrgIdFilter } from "@/lib/auth/get-active-org-id";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

export type StaffMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  active: boolean;
  branchId: string | null;
  branchName: string | null;
  createdAt: string | null;
  /** Operaciones registradas este mes; solo tiene sentido para cajeros. */
  operationsThisMonth: number;
  lastOperationAt: string | null;
};

export type StaffPayload = {
  orgId: number | null;
  members: StaffMember[];
  branches: { id: string; name: string }[];
};

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/**
 * Cajeros o colaboradores de la organización activa, con su sucursal y — para
 * los cajeros — cuánto trabajaron este mes.
 */
export async function getStaff(role: "cashier" | "collaborator"): Promise<StaffPayload> {
  const [supabase, currentUser] = await Promise.all([createClient(), getCurrentUser()]);
  const orgId = await getActiveOrgIdFilter(currentUser);

  if (!orgId) {
    return { orgId: null, members: [], branches: [] };
  }

  const [{ data: userRows }, { data: branchRows }, { data: purchaseRows }] = await Promise.all([
    supabase
      .from("app_user")
      .select(
        "id, first_name, last_name, email, active, branch_id, created_at, branch:branch_id(name), role:role_id(name)",
      )
      .eq("organization_id", orgId)
      .eq("role.name", role)
      .order("first_name"),
    supabase
      .from("branch")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("active", true)
      .order("name"),
    role === "cashier"
      ? supabase
          .from("purchase")
          .select("cashier_id, purchase_date")
          .eq("organization_id", orgId)
          .neq("status", "cancelled")
          .gte("purchase_date", startOfMonth())
      : Promise.resolve({ data: [] as { cashier_id: number; purchase_date: string }[] }),
  ]);

  const operations = new Map<string, { count: number; last: string }>();
  for (const purchase of (purchaseRows ?? []) as { cashier_id: number | null; purchase_date: string }[]) {
    if (purchase.cashier_id === null) continue;
    const key = String(purchase.cashier_id);
    const current = operations.get(key);
    operations.set(key, {
      count: (current?.count ?? 0) + 1,
      last:
        current && current.last > purchase.purchase_date ? current.last : purchase.purchase_date,
    });
  }

  const members: StaffMember[] = ((userRows ?? []) as unknown as Record<string, unknown>[])
    // El join por rol devuelve null para quienes no coinciden con el filtro.
    .filter((row) => row.role !== null)
    .map((row) => {
      const id = String(row.id);
      const branch = row.branch as { name?: string } | null;
      const stats = operations.get(id);
      return {
        id,
        firstName: (row.first_name as string) ?? null,
        lastName: (row.last_name as string) ?? null,
        email: (row.email as string) ?? null,
        active: (row.active as boolean) ?? true,
        branchId: row.branch_id === null ? null : String(row.branch_id),
        branchName: branch?.name ?? null,
        createdAt: (row.created_at as string) ?? null,
        operationsThisMonth: stats?.count ?? 0,
        lastOperationAt: stats?.last ?? null,
      };
    });

  return {
    orgId,
    members,
    branches: ((branchRows ?? []) as { id: number; name: string }[]).map((branch) => ({
      id: String(branch.id),
      name: branch.name,
    })),
  };
}

export function staffName(member: StaffMember): string {
  return `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email || "";
}

export function staffInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function filterStaff(
  members: StaffMember[],
  filters: { q: string; status: string; branch: string },
): StaffMember[] {
  const needle = filters.q.toLowerCase();
  return members.filter((member) => {
    if (needle && !`${staffName(member)} ${member.email ?? ""}`.toLowerCase().includes(needle)) {
      return false;
    }
    if (filters.status === "active" && !member.active) return false;
    if (filters.status === "inactive" && member.active) return false;
    if (filters.branch === "none" && member.branchId !== null) return false;
    if (filters.branch && filters.branch !== "none" && member.branchId !== filters.branch) {
      return false;
    }
    return true;
  });
}
