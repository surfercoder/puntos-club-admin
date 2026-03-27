import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardKpis } from "@/actions/dashboard/analytics/actions";
import { Users, ShoppingCart, Star, TrendingUp, Gift, Coins } from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
};

export function KpiCard({ title, value, subtitle, icon: Icon, iconClassName }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName ?? "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

type KpiCardsProps = {
  data: DashboardKpis;
};

export function KpiCards({ data }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        title="Socios activos"
        value={formatNumber(data.total_active_members)}
        subtitle="Total de miembros activos"
        icon={Users}
        iconClassName="text-chart-2"
      />
      <KpiCard
        title="Ingresos del mes"
        value={formatCurrency(data.revenue_this_month)}
        subtitle="Ventas registradas este mes"
        icon={TrendingUp}
        iconClassName="text-chart-4"
      />
      <KpiCard
        title="Compras del mes"
        value={formatNumber(data.purchases_this_month)}
        subtitle="Transacciones este mes"
        icon={ShoppingCart}
        iconClassName="text-chart-3"
      />
      <KpiCard
        title="Puntos en circulación"
        value={formatNumber(data.points_in_circulation)}
        subtitle="Disponibles en cuentas activas"
        icon={Coins}
        iconClassName="text-chart-1"
      />
      <KpiCard
        title="Canjes del mes"
        value={formatNumber(data.redemptions_this_month)}
        subtitle="Canjes realizados este mes"
        icon={Gift}
        iconClassName="text-chart-5"
      />
      <KpiCard
        title="Puntos canjeados"
        value={formatNumber(data.points_redeemed_this_month)}
        subtitle="Puntos usados este mes"
        icon={Star}
        iconClassName="text-chart-1"
      />
    </div>
  );
}
