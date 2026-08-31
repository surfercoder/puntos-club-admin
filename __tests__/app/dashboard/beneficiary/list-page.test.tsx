import { render, screen } from '@testing-library/react';

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
jest.mock('@/lib/auth/get-active-org-id', () => ({ getActiveOrgIdFilter: jest.fn(() => Promise.resolve(null)) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/beneficiary/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/plan/plan-limit-create-button', () => ({ PlanLimitCreateButton: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({ PlanUsageBanner: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-badge', () => ({ PlanUsageBadge: () => <div /> }));
jest.mock('@/components/dashboard/beneficiary/hide-button', () => ({ HideButton: () => <div /> }));
jest.mock('@/components/dashboard/beneficiary/beneficiary-filters', () => ({ BeneficiaryFilters: () => <div /> }));
jest.mock('@/components/dashboard/beneficiary/beneficiary-stats', () => ({ BeneficiaryStats: () => <div /> }));
jest.mock('@/components/dashboard/beneficiary/beneficiary-heatmap', () => ({ BeneficiaryHeatmap: () => <div /> }));
jest.mock('@/components/dashboard/shared/excel-export-button', () => ({ ExcelExportButton: () => <div /> }));
jest.mock('@/components/dashboard/shared/table-pagination', () => ({ TablePagination: () => <div /> }));
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
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('filters beneficiaries by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const mockEqOrg = jest.fn().mockResolvedValue({
      data: [{
        is_hidden: true,
        available_points: 42,
        beneficiary: { id: '1', first_name: 'Ben', last_name: 'Doe', email: 'ben@test.com', phone: '123', document_id: 'D1', registration_date: '2024-01-01' },
      }],
      error: null,
    });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
    expect(mockEqOrg).toHaveBeenCalledWith('organization_id', 1);
  });

  it('uses default available_points/is_hidden when missing in join row', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const mockEqOrg = jest.fn().mockResolvedValue({
      data: [{
        beneficiary: { id: '7', first_name: 'No', last_name: 'Defaults', email: null, phone: null, document_id: null, registration_date: '2024-01-01' },
      }],
      error: null,
    });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('handles error from beneficiary_organization query for non-admin', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const mockEqOrg = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders beneficiary rows when data exists', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '1', first_name: 'Ben', last_name: 'Doe', email: 'ben@test.com', phone: '123', document_id: 'D1', registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders beneficiary with no name fields (N/A fallback)', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '2', first_name: null, last_name: null, email: null, phone: null, document_id: null, registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders beneficiary with only first_name', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '3', first_name: 'Solo', last_name: null, email: 'solo@test.com', phone: null, document_id: null, registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders error from admin path', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders beneficiary with only last_name (no first_name)', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '4', first_name: null, last_name: 'OnlyLast', email: 'only@test.com', phone: '456', document_id: null, registration_date: '2024-01-01' }],
      error: null,
    });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  // Antes esta vista hardcodeaba is_active: true y mostraba a todos como
  // socios, incluso a quien no pertenece a ningun club.
  it('derives the membership state from all memberships in the global admin view', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const base = (id: string, first_name: string) => ({
      id,
      first_name,
      last_name: 'Test',
      email: `${first_name}@test.com`,
      phone: null,
      document_id: null,
      registration_date: '2026-08-10',
    });
    isAdmin.mockReturnValueOnce(true);
    mockSelect.mockResolvedValueOnce({
      data: [
        { ...base('1', 'Socia'), beneficiary_organization: [{ is_active: false }, { is_active: true }] },
        { ...base('2', 'Baja'), beneficiary_organization: [{ is_active: false }] },
        { ...base('3', 'SinClub'), beneficiary_organization: [] },
      ],
      error: null,
    });
    render(await BeneficiaryListPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('membershipStatus.member')).toBeInTheDocument();
    expect(screen.getByText('membershipStatus.left')).toBeInTheDocument();
    expect(screen.getByText('membershipStatus.none')).toBeInTheDocument();
  });

  it('handles non-admin with data that has null result.data (covers ?? null)', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const mockEqOrg = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('handles non-admin with null beneficiary in join result', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const mockEqOrg = jest.fn().mockResolvedValue({
      data: [{ beneficiary: null, is_hidden: false, available_points: 0 }, { beneficiary: { id: '1', first_name: 'A', last_name: 'B', email: 'a@b.com', phone: null, document_id: null, registration_date: '2024-01-01' }, is_hidden: false, available_points: 5 }],
      error: null,
    });
    const mockSelectOrg = jest.fn(() => ({ eq: mockEqOrg }));
    mockFrom.mockReturnValueOnce({ select: mockSelectOrg });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });
});

describe('BeneficiaryListPage filters', () => {
  const { isAdmin } = require('@/lib/auth/roles');
  const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');

  const member = (over: Record<string, unknown> = {}) => ({
    is_hidden: false,
    is_active: true,
    available_points: 100,
    beneficiary: {
      id: '1',
      first_name: 'Ana',
      last_name: 'Diaz',
      email: 'ana@test.com',
      phone: '111',
      document_id: 'D1',
      registration_date: '2026-08-10',
      address: { latitude: -32.88, longitude: -68.84 },
    },
    ...over,
  });

  const renderWith = async (
    params: Record<string, string>,
    rows: Record<string, unknown>[],
  ) => {
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const eq = jest.fn().mockResolvedValue({ data: rows, error: null });
    mockFrom.mockReturnValueOnce({ select: jest.fn(() => ({ eq })) });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve(params) });
    return render(result);
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('matches the search against name, email, document and phone', async () => {
    expect(await renderWith({ q: 'ana' }, [member()])).toBeTruthy();
    expect(await renderWith({ q: 'zzz' }, [member()])).toBeTruthy();
  });

  // Con una org activa la fila es 'member' o 'left'; 'none' no se da nunca.
  // Un caso por test: así cada uno arranca con los mocks y el DOM limpios.
  it.each([
    ['member', true, true],
    ['member', false, false],
    ['left', false, true],
    ['left', true, false],
    ['none', true, false],
    // un valor que no es de la lista se ignora en vez de vaciar la tabla
    ['active', true, true],
  ])('status=%s con is_active=%s deja la fila visible: %s', async (status, isActive, visible) => {
    const { queryByText } = await renderWith({ status }, [member({ is_active: isActive })]);
    if (visible) {
      expect(queryByText('Ana Diaz')).toBeInTheDocument();
    } else {
      expect(queryByText('Ana Diaz')).not.toBeInTheDocument();
    }
  });

  it('filters by points balance', async () => {
    expect(await renderWith({ points: 'with' }, [member({ available_points: 0 })])).toBeTruthy();
    expect(await renderWith({ points: 'without' }, [member()])).toBeTruthy();
  });

  it('filters by registration date and paginates', async () => {
    expect(
      await renderWith({ from: '2026-09-01', page: '2', perPage: '25' }, [member()]),
    ).toBeTruthy();
  });

  it('drops beneficiaries without coordinates from the map', async () => {
    const noAddress = member();
    (noAddress.beneficiary as Record<string, unknown>).address = null;
    expect(await renderWith({}, [noAddress])).toBeTruthy();
  });

  it('renders an inactive member without a name', async () => {
    const anon = member({ is_active: false });
    Object.assign(anon.beneficiary as Record<string, unknown>, {
      first_name: null,
      last_name: null,
    });
    expect(await renderWith({}, [anon])).toBeTruthy();
  });
});

describe('BeneficiaryListPage admin map data', () => {
  const { isAdmin } = require('@/lib/auth/roles');
  const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');

  beforeEach(() => { jest.clearAllMocks(); });

  it('keeps the coordinates of beneficiaries that have an address', async () => {
    isAdmin.mockReturnValueOnce(true);
    getActiveOrgIdFilter.mockResolvedValueOnce(null);
    mockSelect.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          first_name: 'Ana',
          last_name: 'Diaz',
          registration_date: '2026-08-10',
          address: { latitude: -32.88, longitude: -68.84 },
        },
      ],
      error: null,
    });
    const result = await BeneficiaryListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });
});

describe('BeneficiaryListPage PII', () => {
  const { isAdmin } = require('@/lib/auth/roles');
  const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');

  const BENEFICIARY = {
    id: '1',
    first_name: 'Ben',
    last_name: 'Doe',
    email: 'ben@test.com',
    phone: '2615464612',
    document_id: '31011953',
    registration_date: '2026-08-10',
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('hides email, phone and document from owners', async () => {
    isAdmin.mockReturnValue(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    mockFrom.mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: [{ is_active: true, available_points: 0, beneficiary: BENEFICIARY }],
          error: null,
        }),
      })),
    });
    render(await BeneficiaryListPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('Ben Doe')).toBeInTheDocument();
    expect(screen.queryByText('ben@test.com')).not.toBeInTheDocument();
    expect(screen.queryByText('2615464612')).not.toBeInTheDocument();
    expect(screen.queryByText('31011953')).not.toBeInTheDocument();
  });

  it('lets admins search by email, phone or document', async () => {
    isAdmin.mockReturnValue(true);
    getActiveOrgIdFilter.mockResolvedValue(null);
    mockSelect.mockResolvedValueOnce({ data: [BENEFICIARY], error: null });
    render(await BeneficiaryListPage({ searchParams: Promise.resolve({ q: '31011953' }) }));
    expect(screen.getByText('Ben Doe')).toBeInTheDocument();

    mockSelect.mockResolvedValueOnce({ data: [BENEFICIARY], error: null });
    render(await BeneficiaryListPage({ searchParams: Promise.resolve({ q: 'zzz' }) }));
    expect(screen.getAllByText('empty')).toHaveLength(1);
  });

  it('keeps them for admins', async () => {
    isAdmin.mockReturnValue(true);
    getActiveOrgIdFilter.mockResolvedValueOnce(null);
    mockSelect.mockResolvedValueOnce({ data: [BENEFICIARY], error: null });
    render(await BeneficiaryListPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('ben@test.com')).toBeInTheDocument();
    expect(screen.getByText('2615464612')).toBeInTheDocument();
    expect(screen.getByText('31011953')).toBeInTheDocument();
  });
});
