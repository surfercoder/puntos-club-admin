import PointsRulesPage from '@/app/dashboard/points-rules/page';

const getAllPointsRules = jest.fn();

jest.mock('@/actions/dashboard/points-rules/actions', () => ({
  getAllPointsRules: (...args: unknown[]) => getAllPointsRules(...args),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/dashboard/home/clubi', () => ({ Clubi: () => <div /> }));
jest.mock('@/components/dashboard/points-rules/mother-rule-card', () => ({
  MotherRuleCard: ({ rule }: { rule: unknown }) => (
    <div data-testid="mother-rule">{JSON.stringify(rule)}</div>
  ),
}));
jest.mock('@/components/dashboard/points-rules/campaigns-card', () => ({
  CampaignsCard: ({ campaigns, tab }: { campaigns: unknown[]; tab: string }) => (
    <div data-testid="campaigns" data-tab={tab}>{JSON.stringify(campaigns)}</div>
  ),
}));

const renderPage = async (tab?: string) => {
  const result = await PointsRulesPage({ searchParams: Promise.resolve(tab ? { tab } : {}) });
  return require('react-dom/server').renderToStaticMarkup(result) as string;
};

const rule = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Regla madre',
  description: null,
  rule_type: 'fixed_amount',
  config: { points_per_dollar: 2 },
  is_active: true,
  is_default: true,
  display_icon: null,
  display_name: null,
  start_date: null,
  end_date: null,
  time_start: null,
  time_end: null,
  days_of_week: null,
  branch: null,
  ...over,
});

describe('PointsRulesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllPointsRules.mockResolvedValue({ success: true, data: [rule()] });
  });

  it('passes the default rule to the base-rule card', async () => {
    const html = await renderPage();
    expect(html).toContain('mother-rule');
    expect(html).toContain('&quot;ruleType&quot;:&quot;fixed_amount&quot;');
  });

  it('renders no base rule when the club has none', async () => {
    getAllPointsRules.mockResolvedValue({ success: true, data: [] });
    const html = await renderPage();
    expect(html).toContain('<div data-testid="mother-rule">null</div>');
  });

  it('survives a failed load', async () => {
    getAllPointsRules.mockResolvedValue({ success: false, error: 'boom' });
    expect(await renderPage()).toContain('campaigns');
  });

  it('survives a successful load with no data', async () => {
    getAllPointsRules.mockResolvedValue({ success: true, data: null });
    expect(await renderPage()).toContain('campaigns');
  });

  it('classifies a future campaign as scheduled', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ id: 2, is_default: false, start_date: '2099-01-01', end_date: '2099-12-31' })],
    });
    expect(await renderPage()).toContain('&quot;tab&quot;:&quot;scheduled&quot;');
  });

  it('classifies an expired campaign as finished', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ id: 2, is_default: false, start_date: '2000-01-01', end_date: '2000-12-31' })],
    });
    expect(await renderPage()).toContain('&quot;tab&quot;:&quot;finished&quot;');
  });

  it('treats a paused campaign as finished', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ id: 2, is_default: false, is_active: false })],
    });
    expect(await renderPage()).toContain('&quot;tab&quot;:&quot;finished&quot;');
  });

  it('describes a percentage campaign, its branch and its schedule', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [
        rule({
          id: 2,
          is_default: false,
          rule_type: 'percentage',
          config: { percentage: 5 },
          description: 'Fines de semana',
          display_name: 'Fines de semana dobles',
          display_icon: '📅',
          branch: { name: 'Sucursal Centro' },
          time_start: '18:00:00',
          time_end: '23:00:00',
          start_date: '2026-01-01',
        }),
      ],
    });
    const html = await renderPage();
    expect(html).toContain('Fines de semana dobles');
    expect(html).toContain('Sucursal Centro');
    expect(html).toContain('18:00');
  });

  it('falls back to a generic benefit for a tiered campaign with no dates', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ id: 2, is_default: false, rule_type: 'tiered', config: null })],
    });
    expect(await renderPage()).toContain('benefit.custom');
  });

  it('shows an end-date-only campaign', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ id: 2, is_default: false, end_date: '2099-12-31' })],
    });
    expect(await renderPage()).toContain('validity.until');
  });

  it('handles a base rule with no config and a branch', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ config: null, branch: { name: 'Centro' } })],
    });
    const html = await renderPage();
    expect(html).toContain('&quot;branchName&quot;:&quot;Centro&quot;');
    expect(html).toContain('&quot;config&quot;:{}');
  });

  it('fills in the missing end of a partial time range', async () => {
    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ id: 2, is_default: false, time_start: '18:00:00', time_end: null })],
    });
    expect(await renderPage()).toContain('23:59');

    getAllPointsRules.mockResolvedValue({
      success: true,
      data: [rule({ id: 2, is_default: false, time_start: null, time_end: '23:00:00' })],
    });
    expect(await renderPage()).toContain('00:00');
  });

  it('honours the tab in the query string and ignores junk', async () => {
    expect(await renderPage('finished')).toContain('data-tab="finished"');
    expect(await renderPage('nope')).toContain('data-tab="active"');
  });
});
