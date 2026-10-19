import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
  useLocale: jest.fn(() => 'es'),
}));

const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: jest.fn(() => ({ refresh: mockRefresh })) }));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockGrant = jest.fn();
jest.mock('@/actions/dashboard/organization_notification_limits/actions', () => ({
  grantNotificationCredits: (...args: unknown[]) => mockGrant(...args),
}));

import { toast } from 'sonner';

import NotificationCreditsCard, {
  type NotificationCredit,
} from '@/components/dashboard/organization_notification_limits/notification-credits-card';

const credit = (overrides: Partial<NotificationCredit>): NotificationCredit => ({
  id: 1,
  amount: 50,
  source: 'plan',
  plan: null,
  note: null,
  created_at: '2026-10-01T12:00:00Z',
  ...overrides,
});

function renderCard(credits: NotificationCredit[] = []) {
  return render(<NotificationCreditsCard organizationId="3" granted={50} used={8} credits={credits} />);
}

function submit(amount: string, note = '') {
  fireEvent.change(screen.getByLabelText('amount'), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText('note'), { target: { value: note } });
  fireEvent.click(screen.getByRole('button', { name: 'submit' }));
}

describe('NotificationCreditsCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the empty history', () => {
    renderCard();
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it.each(['', '0', '1.5'])('rejects the amount %p without calling the action', (amount) => {
    renderCard();
    submit(amount);
    expect(toast.error).toHaveBeenCalledWith('invalidAmount');
    expect(mockGrant).not.toHaveBeenCalled();
  });

  it('grants the credits, toasts, refreshes and clears the form', async () => {
    mockGrant.mockResolvedValue({ error: null });
    renderCard();
    submit('20', 'regalo');

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('success'));
    expect(mockGrant).toHaveBeenCalledWith('3', 20, 'regalo');
    expect(mockRefresh).toHaveBeenCalled();
    expect(screen.getByLabelText('amount')).toHaveValue(null);
    expect(screen.getByLabelText('note')).toHaveValue('');
  });

  it('toasts the action error and keeps the form', async () => {
    mockGrant.mockResolvedValue({ error: 'db.forbidden' });
    renderCard();
    submit('-5');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('db.forbidden'));
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByLabelText('amount')).toHaveValue(-5);
  });

  it('lists positive credits with their plan and negative ones with their note', () => {
    renderCard([
      credit({ id: 1, amount: 1500, source: 'plan', plan: 'pro' }),
      credit({ id: 2, amount: -5, source: 'admin', note: 'corrección' }),
    ]);

    expect(screen.getByText(/source\.plan/)).toHaveTextContent('source.plan · pro');
    expect(screen.getByText('+1.500')).toHaveClass('text-brand-green');
    expect(screen.getByText('source.admin')).toBeInTheDocument();
    expect(screen.getByText('corrección')).toBeInTheDocument();
    expect(screen.getByText('-5')).toHaveClass('text-destructive');
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
  });
});
