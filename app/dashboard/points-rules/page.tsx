"use client";

import { useEffect, useState } from "react";
import {
  getAllPointsRules,
  togglePointsRuleStatus,
  deletePointsRule,
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
import { Plus, Pencil, Trash2, Calculator, RefreshCw } from "lucide-react";
import Link from "next/link";

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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PointsRulesPage() {
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [testAmount, setTestAmount] = useState("100");
  const [testResult, setTestResult] = useState<number | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    const result = await getAllPointsRules();
    if (result.success && result.data) {
      setRules(result.data);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const result = await togglePointsRuleStatus(id, !currentStatus);
    if (result.success) {
      loadRules();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the rule "${name}"?`)) {
      const result = await deletePointsRule(id);
      if (result.success) {
        loadRules();
      }
    }
  };

  const handleTestCalculation = async () => {
    setTestLoading(true);
    const result = await testPointsCalculation(parseFloat(testAmount));
    if (result.success) {
      setTestResult(result.points || 0);
    }
    setTestLoading(false);
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed_amount: "Fixed per Dollar",
      percentage: "Percentage",
      fixed_per_item: "Fixed per Item",
      tiered: "Tiered",
    };
    return labels[type] || type;
  };

  const getRuleConfig = (rule: PointsRule) => {
    const config = rule.config;
    switch (rule.rule_type) {
      case "fixed_amount":
        return `${config.points_per_dollar} pts/$`;
      case "percentage":
        return `${config.percentage}%`;
      case "fixed_per_item":
        return `${config.points_per_item} pts/item`;
      case "tiered":
        return "Multiple tiers";
      default:
        return "N/A";
    }
  };

  const getTimeDisplay = (rule: PointsRule) => {
    if (!rule.time_start && !rule.time_end) return "All day";
    return `${rule.time_start?.slice(0, 5) || "00:00"} - ${rule.time_end?.slice(0, 5) || "23:59"}`;
  };

  const getDaysDisplay = (days: number[] | null) => {
    if (!days || days.length === 0) return "Every day";
    if (days.length === 7) return "Every day";
    return days.map(d => DAY_NAMES[d]).join(", ");
  };

  const getDateRangeDisplay = (rule: PointsRule) => {
    if (rule.is_default) return "Always";
    const start = rule.start_date || null;
    const end = rule.end_date || null;
    if (!start && !end) return null;
    if (start && end) return `${start} → ${end}`;
    if (start) return `From ${start}`;
    return `Until ${end}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex mb-6">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link className="text-sm font-medium text-gray-500 hover:text-blue-600" href="/dashboard">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">Points Rules</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Points Rules & Special Offers</h1>
          <p className="text-muted-foreground mt-2">
            Manage how customers earn points from purchases
          </p>
        </div>
        <Link href="/dashboard/points-rules/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </Link>
      </div>

      {/* Test Calculator Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Points Calculator
          </CardTitle>
          <CardDescription>
            Test how many points a purchase would earn with current active rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="test-amount">Purchase Amount ($)</Label>
              <Input
                id="test-amount"
                type="number"
                step="0.01"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <Button onClick={handleTestCalculation} disabled={testLoading}>
              {testLoading ? "Calculating..." : "Calculate"}
            </Button>
            {testResult !== null && (
              <div className="px-6 py-3 bg-primary/10 rounded-lg">
                <div className="text-sm text-muted-foreground">Points Earned</div>
                <div className="text-2xl font-bold text-primary">{testResult}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Rules</CardTitle>
            <Button variant="outline" size="sm" onClick={loadRules}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading rules...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rules found. Create your first rule to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Display</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Config</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Show in App</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleStatus(rule.id, rule.is_active)}
                        />
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{rule.display_icon || "⭐"}</span>
                        <span className="font-medium">{rule.display_name || rule.name}</span>
                        {rule.is_default && (
                          <Badge variant="default">Default</Badge>
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
                      <Badge variant="outline">{getRuleTypeLabel(rule.rule_type)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {getRuleConfig(rule)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getDateRangeDisplay(rule) && (
                          <div>{getDateRangeDisplay(rule)}</div>
                        )}
                        <div>{getTimeDisplay(rule)}</div>
                        <div className="text-muted-foreground">{getDaysDisplay(rule.days_of_week)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.show_in_app ? (
                        <Badge variant="default">Visible</Badge>
                      ) : (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/points-rules/edit/${rule.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id, rule.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
