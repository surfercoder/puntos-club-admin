"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPointsRuleById, updatePointsRule } from "@/actions/dashboard/points-rules/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const EMOJI_OPTIONS = ["⭐", "🌙", "🎉", "💎", "🔥", "🍽️", "☀️", "🎁", "💰", "🏆"];

export default function EditPointsRulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rule_type: "fixed_amount" as "fixed_amount" | "percentage" | "fixed_per_item" | "tiered",
    points_per_dollar: "2",
    percentage: "10",
    is_active: true,
    is_default: false,
    priority: "0",
    display_name: "",
    display_icon: "⭐",
    display_color: "#3B82F6",
    show_in_app: true,
    branch_id: "",
    start_date: "",
    end_date: "",
    time_start: "",
    time_end: "",
    days_of_week: [] as number[],
  });

  useEffect(() => {
    async function fetchRule() {
      const result = await getPointsRuleById(parseInt(id));
      if (result.success && result.data) {
        const rule = result.data;
        const config = rule.config as Record<string, unknown>;

        setFormData({
          name: rule.name || "",
          description: rule.description || "",
          rule_type: rule.rule_type || "fixed_amount",
          points_per_dollar: config?.points_per_dollar?.toString() || config?.points_per_item?.toString() || "2",
          percentage: config?.percentage?.toString() || "10",
          is_active: rule.is_active ?? true,
          is_default: rule.is_default ?? false,
          priority: rule.priority?.toString() || "0",
          display_name: rule.display_name || "",
          display_icon: rule.display_icon || "⭐",
          display_color: rule.display_color || "#3B82F6",
          show_in_app: rule.show_in_app ?? true,
          branch_id: rule.branch_id ? String(rule.branch_id) : "",
          start_date: rule.start_date || "",
          end_date: rule.end_date || "",
          time_start: rule.time_start || "",
          time_end: rule.time_end || "",
          days_of_week: rule.days_of_week || [],
        });
      } else {
        alert("Error loading rule: " + result.error);
        router.push("/dashboard/points-rules");
      }
      setFetching(false);
    }
    fetchRule();
  }, [id, router]);

  useEffect(() => {
    async function loadBranches() {
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
        setBranches([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("branch")
        .select("id, name")
        .eq("organization_id", activeOrgIdNumber)
        .eq("active", true)
        .order("name");

      setBranches((data ?? []) as Array<{ id: string; name: string }>);
    }

    loadBranches();

    // Listen for organization changes
    const handleOrgChange = () => {
      loadBranches();
      setFormData((prev) => ({ ...prev, branch_id: "" }));
    };

    window.addEventListener('orgChanged', handleOrgChange);
    return () => {
      window.removeEventListener('orgChanged', handleOrgChange);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Build config based on rule type
    let config: Record<string, unknown> = {};
    switch (formData.rule_type) {
      case "fixed_amount":
        config = { points_per_dollar: parseFloat(formData.points_per_dollar) };
        break;
      case "percentage":
        config = { percentage: parseFloat(formData.percentage) };
        break;
      case "fixed_per_item":
        config = { points_per_item: parseFloat(formData.points_per_dollar) };
        break;
    }

    const result = await updatePointsRule(parseInt(id), {
      name: formData.name,
      description: formData.description,
      rule_type: formData.rule_type,
      config,
      is_active: formData.is_active,
      is_default: formData.is_default,
      priority: parseInt(formData.priority),
      display_name: formData.display_name || formData.name,
      display_icon: formData.display_icon,
      display_color: formData.display_color,
      show_in_app: formData.is_default ? false : formData.show_in_app,
      branch_id: formData.branch_id ? Number(formData.branch_id) : undefined,
      start_date: formData.is_default ? undefined : (formData.start_date || undefined),
      end_date: formData.is_default ? undefined : (formData.end_date || undefined),
      time_start: formData.is_default ? undefined : (formData.time_start || undefined),
      time_end: formData.is_default ? undefined : (formData.time_end || undefined),
      days_of_week:
        formData.is_default
          ? undefined
          : formData.days_of_week.length > 0
            ? formData.days_of_week
            : undefined,
    });

    setLoading(false);

    if (result.success) {
      router.push("/dashboard/points-rules");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  if (fetching) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/points-rules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rules
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Points Rule</CardTitle>
          <CardDescription>
            Modify how customers earn points from purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div>
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Night Double Points"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when and how this rule applies"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_default: checked,
                        ...(checked
                          ? {
                              start_date: "",
                              end_date: "",
                              time_start: "",
                              time_end: "",
                              days_of_week: [],
                              show_in_app: false,
                            }
                          : {}),
                      })
                    }
                  />
                  <Label htmlFor="is_default">Default</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_in_app"
                    checked={formData.show_in_app}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_in_app: checked })}
                    disabled={formData.is_default}
                  />
                  <Label htmlFor="show_in_app">Show in Mobile App</Label>
                </div>
              </div>
            </div>

            {/* Points Calculation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Points Calculation</h3>

              <div>
                <Label htmlFor="branch_id">Branch *</Label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="0"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Higher priority rules are applied first when multiple rules match. Use 0 for default rules, higher numbers for special promotions.
                </p>
              </div>

              <div>
                <Label htmlFor="rule_type">Rule Type *</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(value: "fixed_amount" | "percentage" | "fixed_per_item" | "tiered") => setFormData({ ...formData, rule_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_amount">Fixed Points per Dollar</SelectItem>
                    <SelectItem value="percentage">Percentage of Amount</SelectItem>
                    <SelectItem value="fixed_per_item">Fixed Points per Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.rule_type === "fixed_amount" && (
                <div>
                  <Label htmlFor="points_per_dollar">Points per Dollar *</Label>
                  <Input
                    id="points_per_dollar"
                    type="number"
                    step="0.1"
                    value={formData.points_per_dollar}
                    onChange={(e) => setFormData({ ...formData, points_per_dollar: e.target.value })}
                    placeholder="2"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Example: 2 means customers earn 2 points for every $1 spent
                  </p>
                </div>
              )}

              {formData.rule_type === "percentage" && (
                <div>
                  <Label htmlFor="percentage">Percentage *</Label>
                  <Input
                    id="percentage"
                    type="number"
                    step="0.1"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                    placeholder="10"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Example: 10 means customers earn points equal to 10% of purchase amount
                  </p>
                </div>
              )}

              {formData.rule_type === "fixed_per_item" && (
                <div>
                  <Label htmlFor="points_per_item">Points per Item *</Label>
                  <Input
                    id="points_per_item"
                    type="number"
                    step="0.1"
                    value={formData.points_per_dollar}
                    onChange={(e) => setFormData({ ...formData, points_per_dollar: e.target.value })}
                    placeholder="10"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Example: 10 means customers earn 10 points for each item purchased
                  </p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule (Optional)</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    disabled={formData.is_default}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    disabled={formData.is_default}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time_start">Start Time</Label>
                  <Input
                    id="time_start"
                    type="time"
                    value={formData.time_start}
                    onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                    disabled={formData.is_default}
                  />
                </div>
                <div>
                  <Label htmlFor="time_end">End Time</Label>
                  <Input
                    id="time_end"
                    type="time"
                    value={formData.time_end}
                    onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
                    disabled={formData.is_default}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Leave empty for all-day. Supports overnight ranges (e.g., 18:00 to 06:00).
              </p>

              <div>
                <Label>Active Days</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {DAY_OPTIONS.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={formData.days_of_week.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                        disabled={formData.is_default}
                      />
                      <Label htmlFor={`day-${day.value}`} className="font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Leave unchecked for all days
                </p>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Display Settings</h3>

              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Night Bonus"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  User-friendly name shown in mobile apps. Defaults to rule name.
                </p>
              </div>

              <div>
                <Label>Icon</Label>
                <div className="flex gap-2 mt-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, display_icon: emoji })}
                      className={`text-2xl p-2 rounded border-2 transition-all ${
                        formData.display_icon === emoji
                          ? "border-primary bg-primary/20 ring-2 ring-primary ring-offset-2 shadow-md scale-110"
                          : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="display_color">Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="display_color"
                    type="color"
                    value={formData.display_color}
                    onChange={(e) => setFormData({ ...formData, display_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.display_color}
                    onChange={(e) => setFormData({ ...formData, display_color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/dashboard/points-rules">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
