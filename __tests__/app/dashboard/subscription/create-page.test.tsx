import CreateSubscriptionPage from '@/app/dashboard/subscription/create/page';

jest.mock('@/components/dashboard/subscription/subscription-form', () => {
  return function MockSubscriptionForm() { return <div data-testid="subscription-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateSubscriptionPage', () => {
  it('exports a default async function', () => {
    expect(typeof CreateSubscriptionPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreateSubscriptionPage();
    expect(result).toBeTruthy();
  });
});
