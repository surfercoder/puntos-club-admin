"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type MonthlyPurchaseStat = {
  month: string;
  revenue: number;
  points_earned: number;
  purchase_count: number;
};

export type MonthlyPointsStat = {
  month: string;
  points_earned: number;
  points_redeemed: number;
};

export type MonthlyMemberStat = {
  month: string;
  new_members: number;
  total_members: number;
};

export type TopProductStat = {
  name: string;
  redemptions: number;
  points_used: number;
};

export type BranchPerformanceStat = {
  branch: string;
  revenue: number;
  purchase_count: number;
};

export type DashboardKpis = {
  total_active_members: number;
  revenue_this_month: number;
  purchases_this_month: number;
  points_in_circulation: number;
  redemptions_this_month: number;
  points_redeemed_this_month: number;
};

async function getOrgId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.organization_id ? Number(user.organization_id) : null;
}

export async function getDashboardKpis(): Promise<DashboardKpis | null> {
  const orgId = await getOrgId();
  if (!orgId) return null;

  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [membersRes, revenueRes, pointsCirculationRes, redemptionsRes] = await Promise.all([
    supabase
      .from("beneficiary_organization")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true),

    supabase
      .from("purchase")
      .select("total_amount, points_earned")
      .eq("organization_id", orgId)
      .gte("purchase_date", startOfMonth),

    supabase
      .from("beneficiary_organization")
      .select("available_points")
      .eq("organization_id", orgId)
      .eq("is_active", true),

    supabase
      .from("redemption")
      .select("points_used")
      .gte("redemption_date", startOfMonth),
  ]);

  const revenue_this_month = (revenueRes.data ?? []).reduce(
    (sum, p) => sum + (p.total_amount ?? 0),
    0
  );
  const _points_earned_this_month = (revenueRes.data ?? []).reduce(
    (sum, p) => sum + (p.points_earned ?? 0),
    0
  );
  const points_in_circulation = (pointsCirculationRes.data ?? []).reduce(
    (sum, b) => sum + (b.available_points ?? 0),
    0
  );
  const points_redeemed_this_month = (redemptionsRes.data ?? []).reduce(
    (sum, r) => sum + (r.points_used ?? 0),
    0
  );

  return {
    total_active_members: membersRes.count ?? 0,
    revenue_this_month,
    purchases_this_month: revenueRes.data?.length ?? 0,
    points_in_circulation,
    redemptions_this_month: redemptionsRes.data?.length ?? 0,
    points_redeemed_this_month,
  };
}

export async function getMonthlyPurchaseStats(
  months = 6
): Promise<MonthlyPurchaseStat[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("purchase")
    .select("purchase_date, total_amount, points_earned")
    .eq("organization_id", orgId)
    .gte("purchase_date", since.toISOString())
    .order("purchase_date", { ascending: true });

  if (error || !data) return [];

  const grouped: Record<string, MonthlyPurchaseStat> = {};
  for (const row of data) {
    const d = new Date(row.purchase_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-AR", { month: "short", year: "2-digit" });
    if (!grouped[key]) {
      grouped[key] = { month: label, revenue: 0, points_earned: 0, purchase_count: 0 };
    }
    grouped[key].revenue += row.total_amount ?? 0;
    grouped[key].points_earned += row.points_earned ?? 0;
    grouped[key].purchase_count += 1;
  }

  return fillMissingMonths(grouped, months, (key, label) => ({
    month: label,
    revenue: 0,
    points_earned: 0,
    purchase_count: 0,
  }));
}

export async function getMonthlyPointsStats(
  months = 6
): Promise<MonthlyPointsStat[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [purchasesRes, redemptionsRes] = await Promise.all([
    supabase
      .from("purchase")
      .select("purchase_date, points_earned")
      .eq("organization_id", orgId)
      .gte("purchase_date", since.toISOString()),
    supabase
      .from("redemption")
      .select("redemption_date, points_used")
      .gte("redemption_date", since.toISOString()),
  ]);

  const grouped: Record<string, MonthlyPointsStat> = {};

  for (const row of purchasesRes.data ?? []) {
    const d = new Date(row.purchase_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-AR", { month: "short", year: "2-digit" });
    if (!grouped[key]) grouped[key] = { month: label, points_earned: 0, points_redeemed: 0 };
    grouped[key].points_earned += row.points_earned ?? 0;
  }

  for (const row of redemptionsRes.data ?? []) {
    const d = new Date(row.redemption_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-AR", { month: "short", year: "2-digit" });
    if (!grouped[key]) grouped[key] = { month: label, points_earned: 0, points_redeemed: 0 };
    grouped[key].points_redeemed += row.points_used ?? 0;
  }

  return fillMissingMonths(grouped, months, (key, label) => ({
    month: label,
    points_earned: 0,
    points_redeemed: 0,
  }));
}

export async function getMonthlyMemberStats(
  months = 12
): Promise<MonthlyMemberStat[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("beneficiary_organization")
    .select("joined_date")
    .eq("organization_id", orgId)
    .gte("joined_date", since.toISOString())
    .order("joined_date", { ascending: true });

  if (error || !data) return [];

  const grouped: Record<string, { month: string; new_members: number }> = {};

  for (const row of data) {
    const d = new Date(row.joined_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-AR", { month: "short", year: "2-digit" });
    if (!grouped[key]) grouped[key] = { month: label, new_members: 0 };
    grouped[key].new_members += 1;
  }

  const filled = fillMissingMonths(grouped, months, (key, label) => ({
    month: label,
    new_members: 0,
  }));

  let cumulative = 0;
  return filled.map((item) => {
    cumulative += item.new_members;
    return { ...item, total_members: cumulative };
  });
}

export async function getTopProducts(limit = 8): Promise<TopProductStat[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("redemption")
    .select(`
      points_used,
      quantity,
      product:product(name, organization_id)
    `)
    .not("product_id", "is", null);

  if (error || !data) return [];

  const grouped: Record<string, TopProductStat> = {};
  for (const row of data) {
    const product = Array.isArray(row.product) ? row.product[0] : row.product;
    if (!product || product.organization_id !== orgId) continue;
    const name = product.name ?? "Unknown";
    if (!grouped[name]) grouped[name] = { name, redemptions: 0, points_used: 0 };
    grouped[name].redemptions += row.quantity ?? 1;
    grouped[name].points_used += row.points_used ?? 0;
  }

  return Object.values(grouped)
    .sort((a, b) => b.redemptions - a.redemptions)
    .slice(0, limit);
}

export async function getBranchPerformance(): Promise<BranchPerformanceStat[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("purchase")
    .select(`
      total_amount,
      branch:branch(name)
    `)
    .eq("organization_id", orgId)
    .not("branch_id", "is", null);

  if (error || !data) return [];

  const grouped: Record<string, BranchPerformanceStat> = {};
  for (const row of data) {
    const branch = Array.isArray(row.branch) ? row.branch[0] : row.branch;
    const name = branch?.name ?? "Sin sucursal";
    if (!grouped[name]) grouped[name] = { branch: name, revenue: 0, purchase_count: 0 };
    grouped[name].revenue += row.total_amount ?? 0;
    grouped[name].purchase_count += 1;
  }

  return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
}

function fillMissingMonths<T extends { month: string }>(
  grouped: Record<string, T>,
  months: number,
  createEmpty: (key: string, label: string) => T
): T[] {
  const result: T[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-AR", { month: "short", year: "2-digit" });
    result.push(grouped[key] ?? createEmpty(key, label));
  }

  return result;
}
