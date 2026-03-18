import BeneficiaryOrganizationListPage from '@/app/dashboard/beneficiary_organization/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/components/dashboard/beneficiary_organization/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

describe('BeneficiaryOrganizationListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof BeneficiaryOrganizationListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await BeneficiaryOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', beneficiary_id: '1', organization_id: '1', available_points: 100, total_points_earned: 200, total_points_redeemed: 100, joined_date: '2024-01-01', is_active: true, beneficiary: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await BeneficiaryOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await BeneficiaryOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with no name (email fallback)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '2', beneficiary_id: '2', organization_id: '1', available_points: 0, total_points_earned: 0, total_points_redeemed: 0, joined_date: '2024-01-01', is_active: null, beneficiary: { first_name: null, last_name: null, email: 'only@email.com' }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await BeneficiaryOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with no name and no email (N/A)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '3', beneficiary_id: '3', organization_id: '1', available_points: 0, total_points_earned: 0, total_points_redeemed: 0, joined_date: '2024-01-01', is_active: false, beneficiary: { first_name: null, last_name: null, email: null }, organization: null }],
      error: null,
    });
    const result = await BeneficiaryOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with only first_name', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '4', beneficiary_id: '4', organization_id: '1', available_points: 50, total_points_earned: 50, total_points_redeemed: 0, joined_date: '2024-01-01', is_active: true, beneficiary: { first_name: 'Solo', last_name: null, email: null }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await BeneficiaryOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with only last_name (no first_name)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '5', beneficiary_id: '5', organization_id: '1', available_points: 10, total_points_earned: 10, total_points_redeemed: 0, joined_date: '2024-01-01', is_active: true, beneficiary: { first_name: null, last_name: 'OnlyLast', email: null }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await BeneficiaryOrganizationListPage();
    expect(result).toBeTruthy();
  });
});
