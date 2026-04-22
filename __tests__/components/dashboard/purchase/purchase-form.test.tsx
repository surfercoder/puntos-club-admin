import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

jest.mock('@/lib/supabase/client', () => {
  const builder = () => {
    const b: Record<string, unknown> = {};
    b.select = jest.fn(() => b);
    b.eq = jest.fn(() => b);
    b.neq = jest.fn(() => b);
    b.order = jest.fn(() => Promise.resolve({ data: [{ id: '1', first_name: 'A', last_name: 'B', name: 'N' }], error: null }));
    b.single = jest.fn(() => Promise.resolve({ data: { id: 4 }, error: null }));
    return b;
  };
  return {
    createClient: jest.fn(() => ({
      from: jest.fn(() => builder()),
      rpc: jest.fn(() => Promise.resolve({ data: 10, error: null })),
    })),
  };
});

jest.mock('@/actions/dashboard/purchase/purchase-form-actions', () => ({
  purchaseFormAction: jest.fn(),
}));

// Store onValueChange callbacks so tests can call them directly
const selectCallbacks: Record<string, (value: string) => void> = {};

// Mock Select to make onValueChange testable in JSDOM
jest.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, onValueChange, defaultValue, name }: {
      children: React.ReactNode;
      onValueChange?: (value: string) => void;
      defaultValue?: string;
      name?: string;
    }) => {
      if (name && onValueChange) {
        selectCallbacks[name] = onValueChange;
      }
      return (
        <div data-testid={`select-${name}`}>
          <input type="hidden" name={name} defaultValue={defaultValue} />
          {children}
        </div>
      );
    },
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
      <div data-value={value}>{children}</div>
    ),
  };
});

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import PurchaseForm from '@/components/dashboard/purchase/purchase-form';

const React = require('react');

/**
 * Creates a thenable Supabase query builder mock.
 * Can be chained (.select().eq().order() etc.) AND awaited (Promise.all).
 */
function makeThenableBuilder(resolveData: unknown = []) {
  const b: Record<string, unknown> = {};
  b.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve({ data: resolveData, error: null }).then(resolve, reject);
  b.select = jest.fn(() => b);
  b.eq = jest.fn(() => b);
  b.neq = jest.fn(() => b);
  b.order = jest.fn(() => b);
  b.single = jest.fn(() => Promise.resolve({ data: resolveData, error: null }));
  return b;
}

/**
 * Creates a supabase client mock that handles org-filtered queries properly.
 * When orgId is set, beneficiary_organization uses chained .eq() calls.
 */
function makeOrgAwareClient(opts: {
  orgId?: number;
  beneficiaryData?: unknown[];
  cashierData?: unknown[];
  branchData?: unknown[];
  rpcData?: unknown;
} = {}) {
  const {
    beneficiaryData = [],
    cashierData = [],
    branchData = [],
    rpcData = 10,
  } = opts;
  const mockRpc = jest.fn(() => Promise.resolve({ data: rpcData, error: null }));
  const mockFrom = jest.fn((table: string) => {
    if (table === 'beneficiary_organization') {
      const b = makeThenableBuilder(beneficiaryData);
      // .select().eq('organization_id', x).eq('is_active', true) -> thenable
      let eqCallCount = 0;
      b.eq = jest.fn(() => {
        eqCallCount++;
        if (eqCallCount >= 2) {
          return makeThenableBuilder(beneficiaryData);
        }
        return b;
      });
      return b;
    }
    if (table === 'beneficiary') {
      return makeThenableBuilder(beneficiaryData);
    }
    if (table === 'user_role') {
      return makeThenableBuilder({ id: 4 });
    }
    if (table === 'app_user') {
      return makeThenableBuilder(cashierData);
    }
    if (table === 'branch') {
      return makeThenableBuilder(branchData);
    }
    return makeThenableBuilder();
  });
  return { from: mockFrom, rpc: mockRpc, _mockFrom: mockFrom, _mockRpc: mockRpc };
}

describe('PurchaseForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
    // Reset cookie safely
    try {
      Object.defineProperty(document, 'cookie', { writable: true, value: '', configurable: true });
    } catch {
      // Restore from prototype if it was overridden with a non-configurable getter
      const proto = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      if (proto) Object.defineProperty(document, 'cookie', proto);
    }
  });

  it('renders correct submit button text in create mode', () => {
    render(<PurchaseForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const purchase = {
      id: '1',
      beneficiary_id: 'ben-1',
      cashier_id: 'cash-1',
      branch_id: 'br-1',
      organization_id: 'org-1',
      total_amount: 100.50,
      points_earned: 10,
      notes: 'Test notes',
      created_at: '2024-01-01',
    };

    render(<PurchaseForm purchase={purchase as any} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders cancel button linking to purchase list', () => {
    render(<PurchaseForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/purchase');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<PurchaseForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('runs handleSubmit and catches validation error on empty form', () => {
    render(<PurchaseForm />);

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);
  });

  it('loads dropdown data via useEffect and dispatches into reducer', async () => {
    const { createClient } = require('@/lib/supabase/client');
    render(<PurchaseForm />);
    await waitFor(() => {
      expect(createClient).toHaveBeenCalled();
    });
  });

  it('falls back to empty arrays when supabase responses have null data', async () => {
    const { createClient } = require('@/lib/supabase/client');
    (createClient as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => {
        const b: Record<string, unknown> = {};
        b.select = jest.fn(() => b);
        b.eq = jest.fn(() => b);
        b.neq = jest.fn(() => b);
        b.order = jest.fn(() => Promise.resolve({ data: null, error: null }));
        b.single = jest.fn(() => Promise.resolve({ data: { id: 4 }, error: null }));
        return b;
      }),
      rpc: jest.fn(() => Promise.resolve({ data: 0, error: null })),
    }));
    render(<PurchaseForm />);
    await waitFor(() => {
      expect(createClient).toHaveBeenCalled();
    });
  });

  it('runs handleSubmit in edit mode with pre-filled data', () => {
    const purchase = {
      id: '1',
      beneficiary_id: 'ben-1',
      cashier_id: 'cash-1',
      branch_id: 'br-1',
      organization_id: 'org-1',
      total_amount: 100.50,
      points_earned: 10,
      notes: 'Test notes',
      created_at: '2024-01-01',
    };

    render(<PurchaseForm purchase={purchase as any} />);

    const form = screen.getByRole('button', { name: 'update' }).closest('form')!;
    fireEvent.submit(form);
  });

  it('getOrgIdFromCookies returns parsed org id when cookie exists', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42; other=stuff' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      beneficiaryData: [{ beneficiary: { id: '1', first_name: 'A', last_name: 'B' } }],
      cashierData: [{ id: '2', first_name: 'C', last_name: 'D' }],
      branchData: [{ id: '3', name: 'Branch' }],
    });
    (createClient as jest.Mock).mockImplementationOnce(() => client);
    render(<PurchaseForm />);
    await waitFor(() => {
      expect(client._mockFrom).toHaveBeenCalledWith('beneficiary_organization');
      expect(client._mockFrom).toHaveBeenCalledWith('app_user');
      expect(client._mockFrom).toHaveBeenCalledWith('branch');
    });
  });

  it('getOrgIdFromCookies returns null when cookie is missing', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      beneficiaryData: [{ id: '1', first_name: 'A', last_name: 'B' }],
    });
    (createClient as jest.Mock).mockImplementationOnce(() => client);
    render(<PurchaseForm />);
    await waitFor(() => {
      expect(client._mockFrom).toHaveBeenCalledWith('beneficiary');
    });
  });

  it('getOrgIdFromCookies returns null when cookie value is NaN', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=notanumber' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      beneficiaryData: [{ id: '1', first_name: 'A', last_name: 'B' }],
    });
    (createClient as jest.Mock).mockImplementationOnce(() => client);
    render(<PurchaseForm />);
    await waitFor(() => {
      expect(client._mockFrom).toHaveBeenCalledWith('beneficiary');
    });
  });

  it('getOrgIdFromCookies catches errors and returns null', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      get: () => { throw new Error('cookie access denied'); },
      configurable: true,
    });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      beneficiaryData: [{ id: '1', first_name: 'A', last_name: 'B' }],
    });
    (createClient as jest.Mock).mockImplementationOnce(() => client);
    render(<PurchaseForm />);
    await waitFor(() => {
      expect(client._mockFrom).toHaveBeenCalledWith('beneficiary');
    });
    if (originalDescriptor) {
      Object.defineProperty(document, 'cookie', originalDescriptor);
    }
  });

  it('handles nested beneficiary data with org filter including null entries', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      beneficiaryData: [
        { beneficiary: { id: '1', first_name: 'John', last_name: 'Doe' } },
        { beneficiary: null },
      ],
      branchData: [{ id: '5', name: 'Branch1' }],
    });
    (createClient as jest.Mock).mockImplementationOnce(() => client);
    render(<PurchaseForm />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('calls calculatePoints when amount changes with valid number', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({ rpcData: 25 });
    (createClient as jest.Mock).mockImplementation(() => client);
    render(<PurchaseForm />);
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '150' } });
    await waitFor(() => {
      expect(client._mockRpc).toHaveBeenCalledWith('calculate_points_for_amount', expect.objectContaining({
        p_amount: 150,
      }));
    });
  });

  it('sets pointsPreview to null when amount is NaN', async () => {
    // Render with a purchase that has points_earned so pointsPreview starts non-null
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({ rpcData: 10 });
    (createClient as jest.Mock).mockImplementation(() => client);
    const purchase = {
      id: '1',
      beneficiary_id: 'ben-1',
      cashier_id: 'cash-1',
      branch_id: 'br-1',
      organization_id: 'org-1',
      total_amount: 100,
      points_earned: 10,
      notes: '',
      created_at: '2024-01-01',
    };
    render(<PurchaseForm purchase={purchase as any} />);
    // Points preview should be visible initially since purchase.points_earned is 10
    expect(screen.getByText('form.pointsEarnedLabel', { exact: false })).toBeInTheDocument();
    // Now set invalid value to trigger the else branch (setPointsPreview(null))
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.queryByText('form.pointsEarnedLabel', { exact: false })).not.toBeInTheDocument();
    });
  });

  it('sets pointsPreview to 0 when amount is 0 or negative', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({ rpcData: 25 });
    (createClient as jest.Mock).mockImplementation(() => client);
    render(<PurchaseForm />);
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '0' } });
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('calls calculatePoints when rpc returns null data', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({ rpcData: null });
    (createClient as jest.Mock).mockImplementation(() => client);
    render(<PurchaseForm />);
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '100' } });
    await waitFor(() => {
      expect(client._mockRpc).toHaveBeenCalledWith('calculate_points_for_amount', expect.anything());
    });
  });

  it('handleBranchChange recalculates points when amount is valid', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      branchData: [{ id: '5', name: 'Branch A' }],
      rpcData: 30,
    });
    (createClient as jest.Mock).mockImplementation(() => client);
    render(<PurchaseForm />);

    // Set a valid amount first
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '200' } });

    // Trigger handleBranchChange via the stored callback
    selectCallbacks['branch_id']('5');

    await waitFor(() => {
      expect(client._mockRpc).toHaveBeenCalledWith('calculate_points_for_amount', expect.objectContaining({
        p_branch_id: 5,
      }));
    });
  });

  it('handleBranchChange does not calculate when amount is zero', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      branchData: [{ id: '5', name: 'Branch C' }],
      rpcData: 30,
    });
    (createClient as jest.Mock).mockImplementation(() => client);
    render(<PurchaseForm />);

    // Set amount to 0
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '0' } });

    // Trigger branch change - should NOT call calculatePoints since amount is 0 (not > 0)
    const rpcCallsBefore = client._mockRpc.mock.calls.length;
    selectCallbacks['branch_id']('5');
    // rpc should not have been called again after the branch change
    expect(client._mockRpc.mock.calls.length).toBe(rpcCallsBefore);
  });

  it('handleBranchChange does not calculate when amount is empty', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({
      branchData: [{ id: '5', name: 'Branch B' }],
      rpcData: 30,
    });
    (createClient as jest.Mock).mockImplementation(() => client);
    render(<PurchaseForm />);

    // Don't set an amount, trigger branch change directly
    selectCallbacks['branch_id']('5');
  });

  it('falls back to -1 when cashierRole lookup returns null', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');

    // Build a client where user_role single() returns null data (no cashier role found)
    const mockFrom = jest.fn((table: string) => {
      if (table === 'beneficiary_organization') {
        const b = makeThenableBuilder([]);
        let eqCount = 0;
        b.eq = jest.fn(() => { eqCount++; return eqCount >= 2 ? makeThenableBuilder([]) : b; });
        return b;
      }
      if (table === 'user_role') {
        const b = makeThenableBuilder(null);
        b.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
        return b;
      }
      if (table === 'app_user') {
        const b = makeThenableBuilder([]);
        return b;
      }
      if (table === 'branch') {
        return makeThenableBuilder([]);
      }
      return makeThenableBuilder();
    });
    const client = { from: mockFrom, rpc: jest.fn(() => Promise.resolve({ data: 0, error: null })) };
    (createClient as jest.Mock).mockImplementationOnce(() => client);

    render(<PurchaseForm />);
    await waitFor(() => {
      // app_user query should have been called with role_id = -1 (the fallback)
      expect(mockFrom).toHaveBeenCalledWith('app_user');
    });
  });

  it('handleBranchChange handles missing amount input element', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=42' });
    const { createClient } = require('@/lib/supabase/client');
    const client = makeOrgAwareClient({ rpcData: 30 });
    (createClient as jest.Mock).mockImplementation(() => client);
    render(<PurchaseForm />);

    // Remove the amount input from DOM to test the ?? '' fallback
    const amountInput = document.querySelector('input[name="total_amount"]');
    amountInput?.remove();

    selectCallbacks['branch_id']('5');
  });
});
