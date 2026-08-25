import React from 'react';
import { render, screen } from '@testing-library/react';
import { Gift } from 'lucide-react';

import { InfoCard } from '@/components/dashboard/shared/info-card';
import { QuickActionsCard } from '@/components/dashboard/shared/quick-actions-card';
import { SummaryCard } from '@/components/dashboard/shared/summary-card';
import { FilterActions, FilterBar, FilterField } from '@/components/dashboard/shared/filter-bar';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('InfoCard', () => {
  it('renders its title and body', () => {
    render(<InfoCard title="Información"><p>Las operaciones son en tiempo real.</p></InfoCard>);
    expect(screen.getByRole('heading', { name: 'Información' })).toBeInTheDocument();
    expect(screen.getByText('Las operaciones son en tiempo real.')).toBeInTheDocument();
  });
});

describe('QuickActionsCard', () => {
  it('renders one link per action', () => {
    render(
      <QuickActionsCard
        title="Acciones rápidas"
        actions={[
          { href: '/a', icon: Gift, tint: 'bg-brand-pink/10', title: 'Uno', description: 'desc' },
          { href: '/b', icon: Gift, tint: 'bg-brand-blue/10', title: 'Dos', description: 'desc' },
        ]}
      />,
    );
    expect(screen.getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/a', '/b']);
  });
});

describe('SummaryCard', () => {
  it('highlights only the rows marked as such and renders the action slot', () => {
    render(
      <SummaryCard
        title="Resumen"
        action={<button type="button">Período</button>}
        rows={[
          { label: 'Puntos', value: '250 pts', highlight: true },
          { label: 'Operaciones', value: '1' },
        ]}
      />,
    );
    expect(screen.getByText('250 pts')).toHaveClass('text-brand-pink');
    expect(screen.getByText('1')).not.toHaveClass('text-brand-pink');
    expect(screen.getByRole('button', { name: 'Período' })).toBeInTheDocument();
  });
});

describe('FilterBar', () => {
  it('renders as a GET form even without extra classes', () => {
    const { container } = render(
      <FilterBar>
        <FilterField label="Buscar"><input name="q" /></FilterField>
        <FilterActions applyLabel="Aplicar" clearLabel="Limpiar" clearHref="/dashboard" />
      </FilterBar>,
    );
    expect(container.querySelector('form')).toHaveAttribute('method', 'GET');
    expect(screen.getByRole('link', { name: 'Limpiar' })).toHaveAttribute('href', '/dashboard');
  });
});
