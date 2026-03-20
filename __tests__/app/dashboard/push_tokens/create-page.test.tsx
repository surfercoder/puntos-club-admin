import CreatePushTokenPage from '@/app/dashboard/push_tokens/create/page';

jest.mock('@/components/dashboard/push_tokens_crud/push-token-form', () => {
  return function MockPushTokenForm() { return <div data-testid="push-token-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreatePushTokenPage', () => {
  it('exports a default async function', () => {
    expect(typeof CreatePushTokenPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreatePushTokenPage();
    expect(result).toBeTruthy();
  });
});
