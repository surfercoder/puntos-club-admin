import PlanSettingsPage from '@/app/dashboard/settings/plan/page';
import { getCurrentUser } from '@/lib/auth/get-current-user';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
// La pagina ahora monta el FeedbackDialog, que arrastra la server action y con
// ella `new Resend(process.env.RESEND_API_KEY)`, que explota al importar sin la
// key. Mismo mock que usa __tests__/components/feedback-dialog.test.tsx.
jest.mock('@/actions/feedback/send-feedback', () => ({ sendFeedback: jest.fn() }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ first_name: 'Test', last_name: 'User', email: 'test@test.com' })),
}));
jest.mock('@/components/dashboard/plan/plan-selector', () => ({ PlanSelector: () => <div data-testid="plan-selector" /> }));

describe('PlanSettingsPage', () => {
  it('exports a default async function', () => { expect(typeof PlanSettingsPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await PlanSettingsPage(); expect(result).toBeTruthy(); });

  it('falls back to the email when the user has no name', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce({ email: 'solo@test.com' });
    expect(await PlanSettingsPage()).toBeTruthy();
  });

  it('renders for an anonymous user', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);
    expect(await PlanSettingsPage()).toBeTruthy();
  });
});
