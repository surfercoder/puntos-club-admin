"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  getAllPointsRules,
  togglePointsRuleStatus,
  testPointsCalculation,
} from "@/actions/dashboard/points-rules/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Calculator, RefreshCw } from "lucide-react";
import Link from "next/link";
import DeleteModal from "@/components/dashboard/points-rules/delete-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PointsRule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  is_default?: boolean;
  priority: number;
  display_name: string;
  display_icon: string;
  display_color: string;
  show_in_app: boolean;
  time_start: string | null;
  time_end: string | null;
  days_of_week: number[] | null;
  start_date?: string | null;
  end_date?: string | null;
  valid_from: string | null;
  valid_until: string | null;
  organization: { name: string } | null;
  branch: { name: string } | null;
  category: { name: string } | null;
}

interface Branch {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface State {
  rules: PointsRule[];
  loading: boolean;
  testAmount: string;
  testBranchId: string;
  branches: Branch[];
  testResult: number | null;
  testLoading: boolean;
}

type Action =
  | { type: "SET_RULES"; payload: PointsRule[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TEST_AMOUNT"; payload: string }
  | { type: "SET_TEST_BRANCH_ID"; payload: string }
  | { type: "SET_BRANCHES"; payload: Branch[] }
  | { type: "SET_TEST_RESULT"; payload: number | null }
  | { type: "SET_TEST_LOADING"; payload: boolean }
  | { type: "RESET_ORG" };

const initialState: State = {
  rules: [],
  loading: true,
  testAmount: "100",
  testBranchId: "",
  branches: [],
  testResult: null,
  testLoading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_RULES":
      return { ...state, rules: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_TEST_AMOUNT":
      return { ...state, testAmount: action.payload };
    case "SET_TEST_BRANCH_ID":
      return { ...state, testBranchId: action.payload };
    case "SET_BRANCHES":
      return { ...state, branches: action.payload };
    case "SET_TEST_RESULT":
      return { ...state, testResult: action.payload };
    case "SET_TEST_LOADING":
      return { ...state, testLoading: action.payload };
    case "RESET_ORG":
      return { ...state, testBranchId: "", branches: [] };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRuleTypeLabel(t: ReturnType<typeof useTranslations>, type: string) {
  const key = `ruleTypes.${type}` as Parameters<typeof t>[0];
  try {
    return t(key);
  } catch {
    return type;
  }
}

function getRuleConfig(t: ReturnType<typeof useTranslations>, rule: PointsRule) {
  const config = rule.config;
  switch (rule.rule_type) {
    case "fixed_amount":
      return `${config.points_per_dollar} pts/$`;
    case "percentage":
      return `${config.percentage}%`;
    case "fixed_per_item":
      return `${config.points_per_item} pts/item`;
    case "tiered":
      return t("ruleTypes.multiplelevels");
    default:
      return "N/A";
  }
}

function getTimeDisplay(t: ReturnType<typeof useTranslations>, rule: PointsRule) {
  if (!rule.time_start && !rule.time_end) return t("schedule.allDay");
  return `${rule.time_start?.slice(0, 5) || "00:00"} - ${rule.time_end?.slice(0, 5) || "23:59"}`;
}

function getDaysDisplay(t: ReturnType<typeof useTranslations>, days: number[] | null) {
  if (!days || days.length === 0) return t("schedule.allDays");
  if (days.length === 7) return t("schedule.allDays");
  const DAY_NAMES = Array.from({ length: 7 }, (_, i) => t(`form.days.${i}` as Parameters<typeof t>[0]));
  return days.map((d) => DAY_NAMES[d]).join(", ");
}

function getDateRangeDisplay(t: ReturnType<typeof useTranslations>, rule: PointsRule) {
  if (rule.is_default) return t("schedule.always");
  const start = rule.start_date || null;
  const end = rule.end_date || null;
  if (!start && !end) return null;
  if (start && end) return `${start} → ${end}`;
  if (start) return t("schedule.from", { date: start });
  return t("schedule.until", { date: end! });
}

// ---------------------------------------------------------------------------
// Sub-component: PointsCalculator
// ---------------------------------------------------------------------------

interface PointsCalculatorProps {
  state: State;
  dispatch: React.Dispatch<Action>;
  t: ReturnType<typeof useTranslations>;
}

function PointsCalculator({ state, dispatch, t }: PointsCalculatorProps) {
  const { testAmount, testBranchId, branches, testResult, testLoading } = state;

  const handleTestCalculation = async () => {
    if (!testBranchId) {
      alert(t("calculator.selectBranchAlert"));
      return;
    }
    dispatch({ type: "SET_TEST_LOADING", payload: true });
    const result = await testPointsCalculation(
      parseFloat(testAmount),
      undefined,
      Number(testBranchId)
    );
    if (result.success) {
      dispatch({ type: "SET_TEST_RESULT", payload: result.points || 0 });
    }
    dispatch({ type: "SET_TEST_LOADING", payload: false });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {t("calculator.title")}
        </CardTitle>
        <CardDescription>{t("calculator.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="test-amount">{t("calculator.purchaseAmount")}</Label>
            <Input
              id="test-amount"
              type="number"
              step="0.01"
              value={testAmount}
              onChange={(e) => dispatch({ type: "SET_TEST_AMOUNT", payload: e.target.value })}
              placeholder="100.00"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="test-branch">{t("calculator.branch")}</Label>
            <select
              id="test-branch"
              value={testBranchId}
              onChange={(e) => dispatch({ type: "SET_TEST_BRANCH_ID", payload: e.target.value })}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">{t("calculator.selectBranch")}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleTestCalculation} disabled={testLoading}>
            {testLoading ? t("calculator.calculating") : t("calculator.calculate")}
          </Button>
          {testResult !== null && (
            <div className="px-6 py-3 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground">{t("calculator.pointsEarned")}</div>
              <div className="text-2xl font-bold text-primary">{testResult}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: RulesTable
// ---------------------------------------------------------------------------

interface RulesTableProps {
  rules: PointsRule[];
  loading: boolean;
  onRefresh: () => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  t: ReturnType<typeof useTranslations>;
}

function RulesTable({ rules, loading, onRefresh, onToggleStatus, t }: RulesTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t("table.title")}</CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("table.refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">{t("table.loading")}</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t("table.empty")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.display")}</TableHead>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.type")}</TableHead>
                <TableHead>{t("table.config")}</TableHead>
                <TableHead>{t("table.schedule")}</TableHead>
                <TableHead>{t("table.priority")}</TableHead>
                <TableHead>{t("table.showInApp")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const dateRange = getDateRangeDisplay(t, rule);
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => onToggleStatus(rule.id, rule.is_active)}
                        />
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? t("status.active") : t("status.inactive")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{rule.display_icon || "\u2B50"}</span>
                        <span className="font-medium">{rule.display_name || rule.name}</span>
                        {rule.is_default && (
                          <Badge variant="default">{t("status.default")}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-muted-foreground">{rule.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRuleTypeLabel(t, rule.rule_type)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{getRuleConfig(t, rule)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {dateRange && <div>{dateRange}</div>}
                        <div>{getTimeDisplay(t, rule)}</div>
                        <div className="text-muted-foreground">
                          {getDaysDisplay(t, rule.days_of_week)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.show_in_app ? (
                        <Badge variant="default">{t("status.visible")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("status.hidden")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/dashboard/points-rules/edit/${rule.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {!rule.is_default && (
                          <DeleteModal
                            ruleId={rule.id}
                            ruleName={rule.name}
                            onDeleted={onRefresh}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PointsRulesPage() {
  const t = useTranslations("PointsRules");
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadBranches = useCallback(async () => {
    const activeOrgId =
      typeof document !== "undefined"
        ? document.cookie
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("active_org_id="))
            ?.split("=")[1]
        : undefined;

    const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;
    if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
      dispatch({ type: "SET_BRANCHES", payload: [] });
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase
      .from("branch")
      .select("id, name")
      .eq("organization_id", activeOrgIdNumber)
      .eq("active", true)
      .order("name");

    dispatch({ type: "SET_BRANCHES", payload: (data ?? []) as Branch[] });
  }, []);

  const loadRules = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    const result = await getAllPointsRules();
    if (result.success && result.data) {
      dispatch({ type: "SET_RULES", payload: result.data });
    }
    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  useEffect(() => {
    loadRules();
    loadBranches();

    const handleOrgChange = () => {
      dispatch({ type: "RESET_ORG" });
      loadRules();
      loadBranches();
    };

    window.addEventListener("orgChanged", handleOrgChange);
    return () => {
      window.removeEventListener("orgChanged", handleOrgChange);
    };
  }, [loadRules, loadBranches]);

  const handleToggleStatus = useCallback(
    async (id: number, currentStatus: boolean) => {
      const result = await togglePointsRuleStatus(id, !currentStatus);
      if (result.success) {
        loadRules();
      }
    },
    [loadRules]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("description")}</p>
        </div>
        <Link href="/dashboard/points-rules/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("createButton")}
          </Button>
        </Link>
      </div>

      <PointsCalculator state={state} dispatch={dispatch} t={t} />

      <RulesTable
        rules={state.rules}
        loading={state.loading}
        onRefresh={loadRules}
        onToggleStatus={handleToggleStatus}
        t={t}
      />
    </div>
  );
}
