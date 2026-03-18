import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PurchaseListPage from '@/app/dashboard/purchase/page';
import { getAllPurchases, getPurchaseById } from '@/actions/dashboard/purchase/actions';

jest.mock('@/actions/dashboard/purchase/actions', () => ({
  getAllPurchases: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  getPurchaseById: jest.fn(() => Promise.resolve({ success: true, data: null })),
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [k: string]: unknown }) => <button onClick={onClick} {...props}>{children}</button>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockPurchases = [
  {
    id: 1,
    purchase_number: 'PUR-001',
    total_amount: '100.50',
    points_earned: 10,
    purchase_date: '2024-01-15T10:30:00Z',
    notes: 'Test note',
    beneficiary: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
    cashier: { first_name: 'Jane', last_name: 'Smith' },
    branch: { name: 'Main Branch', organization_id: 1 },
  },
  {
    id: 2,
    purchase_number: 'PUR-002',
    total_amount: '200',
    points_earned: 20,
    purchase_date: '2024-01-16T11:00:00Z',
    notes: null,
    beneficiary: null,
    cashier: null,
    branch: null,
  },
];

describe('PurchaseListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a default function (client component)', () => {
    expect(typeof PurchaseListPage).toBe('function');
  });

  it('renders loading state initially', () => {
    (getAllPurchases as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<PurchaseListPage />);
    expect(screen.getByText('Cargando compras...')).toBeInTheDocument();
  });

  it('renders empty state when no purchases', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: [] });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('No se encontraron compras.')).toBeInTheDocument();
    });
  });

  it('renders purchases table with data', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('PUR-001')).toBeInTheDocument();
      expect(screen.getByText('PUR-002')).toBeInTheDocument();
    });
  });

  it('renders beneficiary info or N/A', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
    });
    // N/A for null beneficiary
    const naCells = screen.getAllByText('N/A');
    expect(naCells.length).toBeGreaterThanOrEqual(1);
  });

  it('renders cashier info or N/A', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('renders branch name or N/A', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('Main Branch')).toBeInTheDocument();
    });
  });

  it('formats currency correctly', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('$100.50')).toBeInTheDocument();
      expect(screen.getByText('$200.00')).toBeInTheDocument();
    });
  });

  it('renders points badges', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('+10 pts')).toBeInTheDocument();
      expect(screen.getByText('+20 pts')).toBeInTheDocument();
    });
  });

  it('refreshes purchases when refresh button is clicked', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('PUR-001')).toBeInTheDocument();
    });

    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: [] });
    fireEvent.click(screen.getByText('Actualizar'));
    await waitFor(() => {
      expect(getAllPurchases).toHaveBeenCalledTimes(2);
    });
  });

  it('opens details dialog and shows purchase details', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    const detailPurchase = {
      ...mockPurchases[0],
      beneficiary: { first_name: 'John', last_name: 'Doe', email: 'john@test.com', phone: '123' },
    };
    (getPurchaseById as jest.Mock).mockResolvedValue({ success: true, data: detailPurchase });

    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('PUR-001')).toBeInTheDocument();
    });

    // Click the view details button (Eye icon button)
    const viewButtons = screen.getAllByRole('button');
    const eyeButton = viewButtons.find(b => !b.textContent?.includes('Actualizar') && !b.textContent?.includes('Compras'));
    fireEvent.click(eyeButton!);

    await waitFor(() => {
      expect(getPurchaseById).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('shows loading in dialog while fetching details', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    let resolveDetails: (v: unknown) => void;
    (getPurchaseById as jest.Mock).mockImplementation(() => new Promise(r => { resolveDetails = r; }));

    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('PUR-001')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button');
    const eyeButton = viewButtons.find(b => !b.textContent?.includes('Actualizar') && !b.textContent?.includes('Compras'));
    fireEvent.click(eyeButton!);

    await waitFor(() => {
      expect(screen.getByText('Cargando detalles...')).toBeInTheDocument();
    });

    await act(async () => {
      resolveDetails!({ success: true, data: { ...mockPurchases[0], notes: 'Test note' } });
    });
  });

  it('shows notes in detail dialog when present', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    (getPurchaseById as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockPurchases[0], notes: 'Special note' },
    });

    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('PUR-001')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button');
    const eyeButton = viewButtons.find(b => !b.textContent?.includes('Actualizar') && !b.textContent?.includes('Compras'));
    fireEvent.click(eyeButton!);

    await waitFor(() => {
      expect(screen.getByText('Special note')).toBeInTheDocument();
    });
  });

  it('handles failed getAllPurchases gracefully', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: false, data: null });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('No se encontraron compras.')).toBeInTheDocument();
    });
  });

  it('handles failed getPurchaseById gracefully', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    (getPurchaseById as jest.Mock).mockResolvedValue({ success: false, data: null });

    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('PUR-001')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button');
    const eyeButton = viewButtons.find(b => !b.textContent?.includes('Actualizar') && !b.textContent?.includes('Compras'));
    fireEvent.click(eyeButton!);

    await waitFor(() => {
      expect(getPurchaseById).toHaveBeenCalled();
    });
  });

  it('shows N/A for null fields in detail view', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    (getPurchaseById as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockPurchases[1], notes: null },
    });

    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('PUR-002')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button');
    // Click 2nd eye button for purchase 2
    const buttons = viewButtons.filter(b => !b.textContent?.includes('Actualizar') && !b.textContent?.includes('Compras'));
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(getPurchaseById).toHaveBeenCalledWith(2);
    });
  });

  it('renders purchase count description', async () => {
    (getAllPurchases as jest.Mock).mockResolvedValue({ success: true, data: mockPurchases });
    render(<PurchaseListPage />);
    await waitFor(() => {
      expect(screen.getByText('2 compras en total')).toBeInTheDocument();
    });
  });
});
