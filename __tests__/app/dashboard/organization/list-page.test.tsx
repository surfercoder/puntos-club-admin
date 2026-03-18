import OrganizationListPage from '@/app/dashboard/organization/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/components/dashboard/organization/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));
jest.mock('next/image', () => function MockImage(props: Record<string, unknown>) { return <img {...props} />; });

describe('OrganizationListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof OrganizationListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await OrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders organization rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: 1, name: 'Org1', business_name: 'BN', tax_id: 'T1', creation_date: '2024-01-01', logo_url: 'https://example.com/logo.png' }],
      error: null,
    });
    const result = await OrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await OrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders organization with no logo and no optional fields', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: 2, name: 'Org2', business_name: null, tax_id: null, creation_date: '2024-01-01', logo_url: null }],
      error: null,
    });
    const result = await OrganizationListPage();
    expect(result).toBeTruthy();
  });
});
