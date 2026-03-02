"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPointsRule } from "@/actions/dashboard/points-rules/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const DAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const EMOJI_OPTIONS = ["⭐", "🌙", "🎉", "💎", "🔥", "🍽️", "☀️", "🎁", "💰", "🏆"];

export default function NewPointsRulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

    const result = await createPointsRule({
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/points-rules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a las Reglas
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Regla de Puntos</CardTitle>
          <CardDescription>
            Define cómo los clientes acumulan puntos en sus compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              
              <div>
                <Label htmlFor="name">Nombre de la Regla *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej.: Puntos Dobles Nocturnos"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe cuándo y cómo aplica esta regla"
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
                  <Label htmlFor="is_active">Activo</Label>
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
                  <Label htmlFor="is_default">Por Defecto</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_in_app"
                    checked={formData.show_in_app}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_in_app: checked })}
                    disabled={formData.is_default}
                  />
                  <Label htmlFor="show_in_app">Mostrar en App Móvil</Label>
                </div>
              </div>
            </div>

            {/* Points Calculation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cálculo de Puntos</h3>

              <div>
                <Label htmlFor="branch_id">Sucursal *</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar una sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridad *</Label>
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
                  Las reglas de mayor prioridad se aplican primero cuando coinciden varias reglas. Usa 0 para reglas por defecto y números más altos para promociones especiales.
                </p>
              </div>
              
              <div>
                <Label htmlFor="rule_type">Tipo de Regla *</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(value: "fixed_amount" | "percentage" | "fixed_per_item" | "tiered") => setFormData({ ...formData, rule_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_amount">Puntos Fijos por Compra</SelectItem>
                    <SelectItem value="percentage">Porcentaje del Monto</SelectItem>
                    <SelectItem value="fixed_per_item">Puntos Fijos por Ítem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.rule_type === "fixed_amount" && (
                <div>
                  <Label htmlFor="points_per_dollar">Puntos por Compra *</Label>
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
                    Ejemplo: 2 significa que los clientes ganan 2 puntos por cada $1 gastado
                  </p>
                </div>
              )}

              {formData.rule_type === "percentage" && (
                <div>
                  <Label htmlFor="percentage">Porcentaje *</Label>
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
                    Ejemplo: 10 significa que los clientes ganan puntos equivalentes al 10% del monto de compra
                  </p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Horario (Opcional)</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    disabled={formData.is_default}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Fecha de Fin</Label>
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
                  <Label htmlFor="time_start">Hora de Inicio</Label>
                  <Input
                    id="time_start"
                    type="time"
                    value={formData.time_start}
                    onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                    disabled={formData.is_default}
                  />
                </div>
                <div>
                  <Label htmlFor="time_end">Hora de Fin</Label>
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
                Dejar vacío para todo el día. Soporta rangos nocturnos (ej.: 18:00 a 06:00).
              </p>

              <div>
                <Label>Días Activos</Label>
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
                  Dejar sin marcar para todos los días
                </p>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración de Visualización</h3>
              
              <div>
                <Label htmlFor="display_name">Nombre a Mostrar</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Ej.: 🌙 Bonus Nocturno"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Nombre amigable mostrado en la app móvil. Por defecto usa el nombre de la regla.
                </p>
              </div>

              <div>
                <Label>Ícono</Label>
                <div className="flex gap-2 mt-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, display_icon: emoji })}
                      className={`text-2xl p-2 rounded border-2 transition-all ${
                        formData.display_icon === emoji
                          ? "border-primary bg-primary/20 ring-2 ring-primary ring-offset-2 shadow-md scale-110"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
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
                {loading ? "Creando..." : "Crear Regla"}
              </Button>
              <Link href="/dashboard/points-rules">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
