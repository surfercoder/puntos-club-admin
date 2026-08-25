import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getTranslations } from 'next-intl/server';

import { CampaignsCard, type Campaign } from '@/components/dashboard/points-rules/campaigns-card';
import { MotherRuleCard } from '@/components/dashboard/points-rules/mother-rule-card';
import { RuleRowActions } from '@/components/dashboard/points-rules/rule-row-actions';

const togglePointsRuleStatus = jest.fn();
const refresh = jest.fn();
const toastSuccess = jest.fn();
const toastError = jest.fn();

jest.mock('@/actions/dashboard/points-rules/actions', () => ({
  togglePointsRuleStatus: (...args: unknown[]) => togglePointsRuleStatus(...args),
  deletePointsRule: jest.fn(),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/dashboard/points-rules/delete-modal', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-modal" />,
}));
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick} role="menuitem">{children}</div>
  ),
}));

describe('MotherRuleCard', () => {
  const base = { id: 1, ruleType: 'fixed_amount', config: { points_per_dollar: 2 }, branchName: null };

  it('summarises a fixed-amount rule across every branch', async () => {
    render(await MotherRuleCard({ rule: base }));
    expect(screen.getByText('ruleTypes.fixed_amount')).toBeInTheDocument();
    expect(screen.getByText('summary.fixedAmount')).toBeInTheDocument();
    expect(screen.getByText('allBranches')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'editButton' })).toHaveAttribute(
      'href',
      '/dashboard/points-rules/mother',
    );
  });

  it('summarises a percentage rule scoped to one branch', async () => {
    render(
      await MotherRuleCard({
        rule: { ...base, ruleType: 'percentage', config: { percentage: 5 }, branchName: 'Centro' },
      }),
    );
    expect(screen.getByText('summary.percentage')).toBeInTheDocument();
    expect(screen.getByText('singleBranch')).toBeInTheDocument();
  });

  it('summarises a per-item rule', async () => {
    render(
      await MotherRuleCard({
        rule: { ...base, ruleType: 'fixed_per_item', config: { points_per_item: 500 } },
      }),
    );
    expect(screen.getByText('summary.perItem')).toBeInTheDocument();
  });

  // La regla fija otorga puntos por cada $100 (así lo calcula previewPoints y
  // así lo dice el formulario): el resumen no puede prometer "por cada $1".
  it('states the fixed-amount rule per $100, not per $1', async () => {
    (getTranslations as jest.Mock).mockResolvedValueOnce(
      Object.assign(
        (key: string, params?: Record<string, unknown>) =>
          params ? `${key}|${JSON.stringify(params)}` : key,
        { rich: (key: string) => key, raw: () => ({}) },
      ),
    );

    render(await MotherRuleCard({ rule: base }));
    const summary = screen.getByText(/summary\.fixedAmount/);
    expect(summary.textContent).toContain('"points":2');
    expect(summary.textContent).toMatch(/100/);
    expect(summary.textContent).not.toMatch(/"amount":"\$\s?1"/);
  });

  it('skips the summary when the config is unreadable', async () => {
    render(await MotherRuleCard({ rule: { ...base, config: {} } }));
    expect(screen.queryByText('summary.fixedAmount')).not.toBeInTheDocument();
  });

  it('skips the summary for a percentage rule with no percentage', async () => {
    render(await MotherRuleCard({ rule: { ...base, ruleType: 'percentage', config: {} } }));
    expect(screen.queryByText('summary.percentage')).not.toBeInTheDocument();
  });

  it('skips the summary for a per-item rule with no points', async () => {
    render(await MotherRuleCard({ rule: { ...base, ruleType: 'fixed_per_item', config: {} } }));
    expect(screen.queryByText('summary.perItem')).not.toBeInTheDocument();
  });

  it('has no summary for a tiered rule', async () => {
    render(await MotherRuleCard({ rule: { ...base, ruleType: 'tiered', config: {} } }));
    expect(screen.getByText('ruleTypes.tiered')).toBeInTheDocument();
  });

  it('invites the owner to set one up when there is no base rule', async () => {
    render(await MotherRuleCard({ rule: null }));
    expect(screen.getByText('noRule')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'editButton' })).not.toBeInTheDocument();
  });
});

describe('CampaignsCard', () => {
  const campaign = (over: Partial<Campaign> = {}): Campaign => ({
    id: 2,
    name: 'Fines de semana dobles',
    description: 'Cargas dobles los sábados',
    displayIcon: '📅',
    benefit: '2X puntos',
    benefitDetail: null,
    appliesTo: 'Todas las sucursales',
    validity: 'Sáb y Dom',
    schedule: 'Todo el día',
    tab: 'active',
    isActive: true,
    ...over,
  });

  it('lists only the campaigns of the selected tab', async () => {
    render(
      await CampaignsCard({
        campaigns: [campaign(), campaign({ id: 3, name: 'Día del Padre', tab: 'scheduled' })],
        tab: 'active',
      }),
    );
    expect(screen.getByText('Fines de semana dobles')).toBeInTheDocument();
    expect(screen.queryByText('Día del Padre')).not.toBeInTheDocument();
  });

  it('shows the benefit detail and falls back to a star icon', async () => {
    render(
      await CampaignsCard({
        campaigns: [campaign({ displayIcon: null, description: null, benefitDetail: 'Suma 50%' })],
        tab: 'active',
      }),
    );
    expect(screen.getByText('Suma 50%')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('explains an empty tab', async () => {
    render(await CampaignsCard({ campaigns: [], tab: 'finished' }));
    expect(screen.getByText('empty.finished')).toBeInTheDocument();
  });
});

describe('RuleRowActions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pauses a running campaign and refreshes the list', async () => {
    togglePointsRuleStatus.mockResolvedValue({ success: true });
    render(<RuleRowActions ruleId={2} isActive />);
    fireEvent.click(screen.getByText('pause'));

    await waitFor(() => expect(togglePointsRuleStatus).toHaveBeenCalledWith(2, false));
    expect(toastSuccess).toHaveBeenCalledWith('paused');
    expect(refresh).toHaveBeenCalled();
  });

  it('resumes a paused campaign', async () => {
    togglePointsRuleStatus.mockResolvedValue({ success: true });
    render(<RuleRowActions ruleId={2} isActive={false} />);
    fireEvent.click(screen.getByText('resume'));

    await waitFor(() => expect(togglePointsRuleStatus).toHaveBeenCalledWith(2, true));
    expect(toastSuccess).toHaveBeenCalledWith('resumed');
  });

  it('reports a failed toggle without refreshing', async () => {
    togglePointsRuleStatus.mockResolvedValue({ success: false });
    render(<RuleRowActions ruleId={2} isActive />);
    fireEvent.click(screen.getByText('pause'));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('toggleError'));
    expect(refresh).not.toHaveBeenCalled();
  });
});
