import React from 'react';
import { render, screen } from '@testing-library/react';

import { ActiveRuleCard } from '@/components/dashboard/purchase/active-rule-card';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mother = {
  id: 1,
  name: 'Regla madre',
  isDefault: true,
  validFrom: null,
  validUntil: null,
  points: 1000,
};

const campaign = {
  id: 2,
  name: 'Campaña Invierno 2026',
  isDefault: false,
  validFrom: '2026-08-01',
  validUntil: '2026-08-31',
  points: 100,
};

const rules = { rules: [mother, campaign], sampleAmount: 1000, samplePoints: 1100 };

describe('ActiveRuleCard', () => {
  it('lists every rule that applies and breaks down the total', async () => {
    render(await ActiveRuleCard({ rules }));
    // Cada regla se nombra dos veces: en la lista de arriba y en el desglose.
    expect(screen.getAllByText('Regla madre')).toHaveLength(2);
    expect(screen.getAllByText('Campaña Invierno 2026')).toHaveLength(2);
    expect(screen.getByText('motherRule')).toBeInTheDocument();
    expect(screen.getByText('campaign')).toBeInTheDocument();
    // El total es la suma, y cada aporte se muestra por separado.
    expect(screen.getByText('1.100 pts')).toBeInTheDocument();
    expect(screen.getByText('+1.000 pts')).toBeInTheDocument();
    expect(screen.getByText('+100 pts')).toBeInTheDocument();
    // Solo la campaña tiene fechas: la madre no muestra línea de vigencia.
    expect(screen.getAllByText('validity')).toHaveLength(1);
  });

  it('keeps the validity line for an open-ended campaign', async () => {
    render(
      await ActiveRuleCard({
        rules: { ...rules, rules: [{ ...campaign, validUntil: null }] },
      }),
    );
    expect(screen.getByText('validity')).toBeInTheDocument();
  });

  it('invites the owner to create a rule when there is none', async () => {
    render(await ActiveRuleCard({ rules: null }));
    expect(screen.getByText('noRule')).toBeInTheDocument();
    expect(screen.queryByText('previewTitle')).not.toBeInTheDocument();
  });

  it('shows no preview when the org has rules but none apply', async () => {
    render(await ActiveRuleCard({ rules: { ...rules, rules: [] } }));
    expect(screen.getByText('noRule')).toBeInTheDocument();
    expect(screen.queryByText('previewTitle')).not.toBeInTheDocument();
  });

  it('always links to the full rule list', async () => {
    render(await ActiveRuleCard({ rules: null }));
    expect(screen.getByRole('link', { name: 'allRules' })).toHaveAttribute(
      'href',
      '/dashboard/points-rules',
    );
  });
});
