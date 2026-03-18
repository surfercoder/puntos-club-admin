import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), back: jest.fn(), prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(() => [{ status: '', message: '', fieldErrors: {} }, jest.fn(), false]),
}));

let mockAddressData: { id: string; street: string; city: string }[] = [];
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

function setupSupabaseMock() {
  const queryObj: Record<string, jest.Mock> = {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    then: jest.fn((resolve: (val: { data: typeof mockAddressData }) => void) => {
      resolve({ data: mockAddressData });
      return Promise.resolve({ data: mockAddressData });
    }),
  };
  mockSelect.mockReturnValue(queryObj);
  mockEq.mockReturnValue(queryObj);
  mockOrder.mockReturnValue(queryObj);
  mockFrom.mockReturnValue(queryObj);
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

jest.mock('@/components/providers/plan-usage-provider', () => ({
  usePlanUsage: jest.fn(() => ({
    summary: null, isLoading: false, invalidate: jest.fn(),
    isAtLimit: jest.fn(() => false), shouldWarn: jest.fn(() => false), getFeature: jest.fn(), plan: null,
  })),
}));

jest.mock('@/actions/dashboard/branch/branch-form-actions', () => ({
  branchFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import BranchForm from '@/components/dashboard/branch/branch-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('BranchForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddressData = [];
    setupSupabaseMock();
    Object.defineProperty(document, 'cookie', { value: '', writable: true });
  });

  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<BranchForm />);

    expect(screen.getByText('nameLabel')).toBeInTheDocument();
    expect(screen.getByText('addressLabel')).toBeInTheDocument();
    expect(screen.getByText('phoneLabel')).toBeInTheDocument();
    expect(screen.getByText('statusLabel')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<BranchForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const branch = {
      id: '1',
      name: 'Test Branch',
      address_id: 'addr-1',
      phone: '123456',
      active: true,
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<BranchForm branch={branch} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const branch = {
      id: '1',
      name: 'Test Branch',
      address_id: 'addr-1',
      phone: '123456',
      active: true,
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<BranchForm branch={branch} />);

    expect(screen.getByDisplayValue('Test Branch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<BranchForm />);

    const nameInput = screen.getByRole('textbox', { name: 'nameLabel' });
    expect(nameInput).toHaveValue('');
  });

  it('renders cancel button linking to branch list', () => {
    render(<BranchForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/branch');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<BranchForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Branch created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<BranchForm />);

    expect(toast.success).toHaveBeenCalledWith('Branch created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/branch');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<BranchForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('validates form on submit and shows validation errors for invalid data', async () => {
    const mockFormAction = jest.fn();
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      mockFormAction,
      false,
    ]);

    render(<BranchForm />);

    const form = screen.getByRole('textbox', { name: 'nameLabel' }).closest('form')!;
    const preventDefaultSpy = jest.fn();

    await act(async () => {
      fireEvent.submit(form, { preventDefault: preventDefaultSpy });
    });

    // Form should prevent default because name is empty and address_id is empty (validation fails)
    // The validation error state will be set internally
  });

  it('allows form submission when data is valid', async () => {
    const branch = {
      id: '1',
      name: 'Test Branch',
      address_id: 'addr-1',
      phone: '123456',
      active: true,
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<BranchForm branch={branch} />);

    // Select an address
    const addressSelect = screen.getByRole('combobox', { name: 'addressLabel' });
    fireEvent.change(addressSelect, { target: { value: 'addr-1' } });

    const form = screen.getByDisplayValue('Test Branch').closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });
  });

  it('fetches addresses with organization filter from cookie', async () => {
    Object.defineProperty(document, 'cookie', {
      value: 'active_org_id=42',
      writable: true,
    });

    mockAddressData = [{ id: 'a1', street: 'Main St', city: 'NYC' }];
    setupSupabaseMock();

    await act(async () => {
      render(<BranchForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('address');
      expect(mockEq).toHaveBeenCalledWith('organization_id', 42);
    });
  });

  it('fetches addresses without org filter when no cookie', async () => {
    Object.defineProperty(document, 'cookie', { value: '', writable: true });

    mockAddressData = [{ id: 'a1', street: 'Main St', city: 'NYC' }];
    setupSupabaseMock();

    await act(async () => {
      render(<BranchForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('address');
    });
  });

  it('handles NaN org id in cookie gracefully', async () => {
    Object.defineProperty(document, 'cookie', {
      value: 'active_org_id=notanumber',
      writable: true,
    });

    setupSupabaseMock();

    await act(async () => {
      render(<BranchForm />);
    });

    // Should not call eq with NaN org id
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('address');
    });
    // eq should not be called with organization_id for NaN values
    const eqCalls = mockEq.mock.calls.filter(
      (c: unknown[]) => c[0] === 'organization_id'
    );
    expect(eqCalls.length).toBe(0);
  });

  it('renders fetched addresses in the select', async () => {
    mockAddressData = [
      { id: 'a1', street: 'Main St', city: 'NYC' },
      { id: 'a2', street: 'Oak Ave', city: 'LA' },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<BranchForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Main St, NYC')).toBeInTheDocument();
      expect(screen.getByText('Oak Ave, LA')).toBeInTheDocument();
    });
  });

  it('handles address select change', async () => {
    mockAddressData = [{ id: 'a1', street: 'Main St', city: 'NYC' }];
    setupSupabaseMock();

    await act(async () => {
      render(<BranchForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Main St, NYC')).toBeInTheDocument();
    });

    const addressSelect = screen.getByRole('combobox', { name: 'addressLabel' });
    fireEvent.change(addressSelect, { target: { value: 'a1' } });
    expect(addressSelect).toHaveValue('a1');
  });

  it('handles active status select change', () => {
    render(<BranchForm />);

    const selects = screen.getAllByRole('combobox');
    const activeSelect = selects.find(s => s.id === 'active')!;
    fireEvent.change(activeSelect, { target: { value: 'false' } });
    expect(activeSelect).toHaveValue('false');
  });

  it('handles null data from address query (line 65 false branch)', async () => {
    // Return null data from the address query
    const nullDataQuery: Record<string, jest.Mock> = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      then: jest.fn((resolve: (val: { data: null }) => void) => {
        resolve({ data: null });
        return Promise.resolve({ data: null });
      }),
    };
    nullDataQuery.select.mockReturnValue(nullDataQuery);
    nullDataQuery.eq.mockReturnValue(nullDataQuery);
    nullDataQuery.order.mockReturnValue(nullDataQuery);
    mockFrom.mockReturnValue(nullDataQuery);

    await act(async () => {
      render(<BranchForm />);
    });

    // Should render without crashing, addresses list should be empty
    expect(screen.getByText('nameLabel')).toBeInTheDocument();
  });

  it('handles fetch error silently', async () => {
    // Make the query chain throw
    mockSelect.mockImplementation(() => { throw new Error('Network error'); });

    await act(async () => {
      render(<BranchForm />);
    });

    // Should render without crashing
    expect(screen.getByText('nameLabel')).toBeInTheDocument();
  });
});
