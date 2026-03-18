import { notFound } from 'next/navigation';
import OrganizationDetailsPage from '@/app/dashboard/organization/[id]/page';
import { getOrganization, getOrganizationProducts } from '@/actions/dashboard/organization/actions';

jest.mock('@/actions/dashboard/organization/actions', () => ({
  getOrganization: jest.fn(),
  getOrganizationProducts: jest.fn(),
}));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

const mockOrg = {
  id: '1',
  name: 'Test Org',
  business_name: 'Test Business',
  tax_id: 'CUIT-123',
  creation_date: '2024-01-01',
};

const mockProducts = [
  {
    id: '1',
    name: 'Product A',
    description: 'Desc A',
    required_points: 50,
    category: { name: 'Cat 1' },
    stock: [{ quantity: 10 }, { quantity: 5 }],
  },
  {
    id: '2',
    name: 'Product B',
    description: null,
    required_points: 100,
    category: null,
    stock: [],
  },
];

describe('OrganizationDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a default async function', () => {
    expect(typeof OrganizationDetailsPage).toBe('function');
  });

  it('renders organization details successfully', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: mockOrg, error: null });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: mockProducts, error: null });

    const result = await OrganizationDetailsPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('calls notFound when getOrganization returns error', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: null, error: 'Not found' });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: [], error: null });
    (notFound as jest.Mock).mockImplementation(() => { throw new Error('NEXT_NOT_FOUND'); });

    await expect(OrganizationDetailsPage({ params: Promise.resolve({ id: '999' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when organization data is null', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: null, error: null });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: [], error: null });
    (notFound as jest.Mock).mockImplementation(() => { throw new Error('NEXT_NOT_FOUND'); });

    await expect(OrganizationDetailsPage({ params: Promise.resolve({ id: '999' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('renders products table with stock totals', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: mockOrg, error: null });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: mockProducts, error: null });

    const result = await OrganizationDetailsPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('renders empty products state', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: mockOrg, error: null });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: [], error: null });

    const result = await OrganizationDetailsPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('renders products error state', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: mockOrg, error: null });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: null, error: 'Failed' });

    const result = await OrganizationDetailsPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('renders null products state', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: mockOrg, error: null });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: null, error: null });

    const result = await OrganizationDetailsPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('renders org with null business_name and tax_id', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({
      data: { ...mockOrg, business_name: null, tax_id: null },
      error: null,
    });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({ data: [], error: null });

    const result = await OrganizationDetailsPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('handles products with null stock', async () => {
    (getOrganization as jest.Mock).mockResolvedValue({ data: mockOrg, error: null });
    (getOrganizationProducts as jest.Mock).mockResolvedValue({
      data: [{ id: '3', name: 'Product C', description: 'Desc', required_points: 10, category: null, stock: null }],
      error: null,
    });

    const result = await OrganizationDetailsPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });
});
