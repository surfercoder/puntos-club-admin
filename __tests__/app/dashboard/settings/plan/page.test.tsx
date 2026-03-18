import PlanSettingsPage from '@/app/dashboard/settings/plan/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/plan/plan-selector', () => ({ PlanSelector: () => <div data-testid="plan-selector" /> }));

describe('PlanSettingsPage', () => {
  it('exports a default async function', () => { expect(typeof PlanSettingsPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await PlanSettingsPage(); expect(result).toBeTruthy(); });
});
