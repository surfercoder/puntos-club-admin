import React from 'react';
import { render, screen } from '@testing-library/react';

import { ActiveRuleCard } from '@/components/dashboard/purchase/active-rule-card';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const rule = {
  id: 1,
  name: 'Campaña Invierno 2026',
  ruleType: 'fixed_amount',
  isDefault: false,
  validFrom: '2026-08-01',
  validUntil: '2026-08-31',
  perAmount: 100,
  points: 10,
  sampleAmount: 1000,
  samplePoints: 100,
};

describe('ActiveRuleCard', () => {
  it('shows the campaign, its validity and the points it grants', async () => {
    render(await ActiveRuleCard({ rule }));
    expect(screen.getByText('Campaña Invierno 2026')).toBeInTheDocument();
    expect(screen.getByText('campaign')).toBeInTheDocument();
    expect(screen.getByText('validity')).toBeInTheDocument();
    expect(screen.getByText('10 pts')).toBeInTheDocument();
    expect(screen.getByText('100 pts')).toBeInTheDocument();
  });

  it('labels the base rule and an open-ended validity', async () => {
    render(
      await ActiveRuleCard({
        rule: { ...rule, isDefault: true, validUntil: null },
      }),
    );
    expect(screen.getByText('motherRule')).toBeInTheDocument();
    expect(screen.getByText('validity')).toBeInTheDocument();
  });

  it('says "each item" when the rule has no reference amount', async () => {
    render(await ActiveRuleCard({ rule: { ...rule, perAmount: null } }));
    expect(screen.getByText('perItem')).toBeInTheDocument();
  });

  it('hides the conversion block when the rule has no simple point value', async () => {
    render(await ActiveRuleCard({ rule: { ...rule, points: null } }));
    expect(screen.queryByText('grants')).not.toBeInTheDocument();
  });

  it('drops the validity line when the rule has no dates', async () => {
    render(await ActiveRuleCard({ rule: { ...rule, validFrom: null, validUntil: null } }));
    expect(screen.queryByText('validity')).not.toBeInTheDocument();
  });

  it('invites the owner to create a rule when there is none', async () => {
    render(await ActiveRuleCard({ rule: null }));
    expect(screen.getByText('noRule')).toBeInTheDocument();
    expect(screen.queryByText('previewTitle')).not.toBeInTheDocument();
  });

  it('always links to the full rule list', async () => {
    render(await ActiveRuleCard({ rule: null }));
    expect(screen.getByRole('link', { name: 'allRules' })).toHaveAttribute(
      'href',
      '/dashboard/points-rules',
    );
  });
});
