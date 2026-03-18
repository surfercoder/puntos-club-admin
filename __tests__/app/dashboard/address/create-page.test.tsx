import CreateAddressPage from '@/app/dashboard/address/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/address/address-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('CreateAddressPage', () => {
  it('exports a default async function', () => { expect(typeof CreateAddressPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateAddressPage(); expect(result).toBeTruthy(); });
});
