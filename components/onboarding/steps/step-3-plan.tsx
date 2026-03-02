'use client';

import { useState } from 'react';
import { Check, Star, Zap, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  features: {
    label: string;
    value: string | boolean;
    highlight?: boolean;
  }[];
}

const plans: Plan[] = [
  {
    id: 'trial',
    name: 'Plan Trial',
    price: 'Gratis',
    priceNote: 'por 3 meses',
    icon: Star,
    color: 'emerald',
    features: [
      { label: 'Premios canjeables', value: '2' },
      { label: 'Beneficiarios', value: '100' },
      { label: 'Notificaciones / mes', value: '3' },
      { label: 'Cajeros', value: '1' },
      { label: 'Sucursales', value: '1' },
      { label: 'Usuarios colaboradores', value: '1' },
      { label: 'Mapa de beneficiarios', value: false },
      { label: 'Dashboard', value: 'Básico' },
      { label: 'Exportación Excel / PDF', value: false },
      { label: 'IA personalizada', value: false },
    ],
  },
  {
    id: 'advance',
    name: 'Plan Advance',
    price: '$50',
    priceNote: 'por mes',
    icon: Zap,
    color: 'blue',
    badge: 'Popular',
    features: [
      { label: 'Premios canjeables', value: '10', highlight: true },
      { label: 'Beneficiarios', value: '500', highlight: true },
      { label: 'Notificaciones / mes', value: '10', highlight: true },
      { label: 'Cajeros', value: '10', highlight: true },
      { label: 'Sucursales', value: '5', highlight: true },
      { label: 'Usuarios colaboradores', value: '3', highlight: true },
      { label: 'Mapa de beneficiarios', value: true },
      { label: 'Dashboard', value: 'Business Intelligence' },
      { label: 'Exportación Excel / PDF', value: false },
      { label: 'IA personalizada', value: 'Mensajería adaptada' },
    ],
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    price: '$89',
    priceNote: 'por mes',
    icon: Rocket,
    color: 'purple',
    features: [
      { label: 'Premios canjeables', value: '30', highlight: true },
      { label: 'Beneficiarios', value: '5.000', highlight: true },
      { label: 'Notificaciones / mes', value: '50', highlight: true },
      { label: 'Cajeros', value: '100', highlight: true },
      { label: 'Sucursales', value: '15', highlight: true },
      { label: 'Usuarios colaboradores', value: '10', highlight: true },
      { label: 'Mapa de beneficiarios', value: true },
      { label: 'Dashboard', value: 'Business Intelligence' },
      { label: 'Exportación Excel / PDF', value: true },
      { label: 'IA personalizada', value: true },
    ],
  },
];

const colorMap: Record<string, string> = {
  emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
};

const iconColorMap: Record<string, string> = {
  emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40',
  blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40',
  purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40',
};

const badgeColorMap: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
};

const buttonColorMap: Record<string, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-emerald-600" />
    ) : (
      <span className="text-muted-foreground text-xs">—</span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

interface Step3Props {
  onNext: (plan: string) => void;
  onBack: () => void;
  initialPlan?: string;
}

export function Step3Plan({ onNext, onBack, initialPlan = 'trial' }: Step3Props) {
  const [selected, setSelected] = useState<string>(initialPlan);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              className={cn(
                'relative flex flex-col rounded-xl border-2 p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                isSelected
                  ? colorMap[plan.color]
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    'absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold',
                    badgeColorMap[plan.color]
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={cn('rounded-lg p-2', iconColorMap[plan.color])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    {plan.priceNote && (
                      <span className="text-xs text-muted-foreground">{plan.priceNote}</span>
                    )}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{feature.label}</span>
                    <FeatureValue value={feature.value} />
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  Plan seleccionado
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Todos los planes incluyen soporte por email. Puedes cambiar de plan en cualquier momento.
      </p>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Atrás
        </Button>
        <Button
          type="button"
          className={cn('flex-1', buttonColorMap[plans.find((p) => p.id === selected)?.color ?? 'emerald'])}
          onClick={() => onNext(selected)}
        >
          Continuar con {plans.find((p) => p.id === selected)?.name}
        </Button>
      </div>
    </div>
  );
}
