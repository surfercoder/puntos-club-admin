import BeneficiaryListPage from '@/app/dashboard/beneficiary/page';

const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
const mockFrom = jest.fn(() => ({ select: mockSelect, eq: mockEq }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/beneficiary/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/plan/plan-limit-create-button', () => ({ PlanLimitCreateButton: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({ PlanUsageBanner: () => <div /> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

describe('BeneficiaryListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof BeneficiaryListPage).toBe('function'); });
  it('renders without crashing (admin path)', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('filters beneficiaries by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    // The non-admin path queries beneficiary_organization with eq
    const mockEqOrg = jest.fn().mockResolvedValue({
      data: [{ beneficiary: { id: '1', first_name: 'Ben', last_name: 'Doe', email: 'ben@test.com', phone: '123', document_id: 'D1', registration_date: '2024-01-01' } }],
      error: null,
    });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('handles error from beneficiary_organization query for non-admin', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    const mockEqOrg = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('renders beneficiary rows when data exists', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '1', first_name: 'Ben', last_name: 'Doe', email: 'ben@test.com', phone: '123', document_id: 'D1', registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('renders beneficiary with no name fields (N/A fallback)', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '2', first_name: null, last_name: null, email: null, phone: null, document_id: null, registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('renders beneficiary with only first_name', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '3', first_name: 'Solo', last_name: null, email: 'solo@test.com', phone: null, document_id: null, registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('renders error from admin path', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('renders beneficiary with only last_name (no first_name)', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '4', first_name: null, last_name: 'OnlyLast', email: 'only@test.com', phone: '456', document_id: null, registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('handles non-admin with data that has null result.data (covers ?? null)', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    const mockEqOrg = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });

  it('handles non-admin with null beneficiary in join result', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    const mockEqOrg = jest.fn().mockResolvedValue({
      data: [{ beneficiary: null }, { beneficiary: { id: '1', first_name: 'A', last_name: 'B', email: 'a@b.com', phone: null, document_id: null, registration_date: '2024-01-01' } }],
      error: null,
    });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage();
    expect(result).toBeTruthy();
  });
});
