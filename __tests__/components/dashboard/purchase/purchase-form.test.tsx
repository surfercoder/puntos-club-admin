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

// Mock Combobox: render every option so tests can assert labels without opening the popover
jest.mock('@/components/ui/combobox', () => ({
  Combobox: ({ name, options, defaultValue, placeholder, onValueChange }: {
    name: string;
    options: { value: string; label: string }[];
    defaultValue?: string;
    placeholder: string;
    onValueChange?: (value: string) => void;
  }) => {
    if (onValueChange) {
      selectCallbacks[name] = onValueChange;
    }
    return (
      <div data-testid={`combobox-${name}`}>
        <input type="hidden" name={name} defaultValue={defaultValue} />
        <span>{placeholder}</span>
        {options.map((o) => <div key={o.value} data-value={o.value}>{o.label}</div>)}
      </div>
    );
  },
}));

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
  b.limit = jest.fn(() => b);
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
    try {
      Object.defineProperty(document, 'cookie', { writable: true, value: '', configurable: true });
    } catch {
      const proto = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      if (proto) Object.defineProperty(document, 'cookie', proto);
    }
  });

  const setClient = (client: unknown) => {
    const { createClient } = require('@/lib/supabase/client');
    (createClient as jest.Mock).mockReturnValue(client);
  };

  it('starts in assignment mode and posts it as the operation mode', async () => {
    setClient(makeOrgAwareClient());
    const { container } = render(<PurchaseForm />);
    await waitFor(() => expect(container.querySelector('input[name="mode"]')).toHaveValue('assignment'));
    expect(screen.getByRole('button', { name: 'submitAssignment' })).toBeInTheDocument();
    expect(container.querySelector('input[name="points_earned"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="total_amount"]')).not.toBeInTheDocument();
  });

  it('switches to sale mode and swaps the amount field in', async () => {
    setClient(makeOrgAwareClient());
    const { container } = render(<PurchaseForm />);
    fireEvent.click(screen.getAllByRole('radio')[1]);

    await waitFor(() => expect(container.querySelector('input[name="mode"]')).toHaveValue('sale'));
    expect(screen.getByRole('button', { name: 'submitSale' })).toBeInTheDocument();
    expect(container.querySelector('input[name="total_amount"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="points_earned"]')).not.toBeInTheDocument();
  });

  it('loads beneficiaries and branches scoped to the active organization', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=7', configurable: true });
    const client = makeOrgAwareClient({
      beneficiaryData: [{ beneficiary: { id: '1', first_name: 'Ana', last_name: 'Diaz' } }],
      branchData: [{ id: '3', name: 'Sucursal Centro' }],
    });
    setClient(client);

    render(<PurchaseForm />);
    await waitFor(() => expect(screen.getByText('Ana Diaz')).toBeInTheDocument());
    expect(client._mockFrom).toHaveBeenCalledWith('beneficiary_organization');
    expect(screen.getByText('Sucursal Centro')).toBeInTheDocument();
  });

  it('falls back to every beneficiary when no organization is active', async () => {
    const client = makeOrgAwareClient({
      beneficiaryData: [{ id: '1', first_name: 'Ana', last_name: 'Diaz' }],
    });
    setClient(client);

    render(<PurchaseForm />);
    await waitFor(() => expect(client._mockFrom).toHaveBeenCalledWith('beneficiary'));
  });

  it('shows the beneficiary balance and the resulting total once one is picked', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=7', configurable: true });
    setClient(makeOrgAwareClient({
      beneficiaryData: [{ available_points: 9500 }],
      branchData: [],
    }));

    const { container } = render(<PurchaseForm />);
    await waitFor(() => expect(selectCallbacks['beneficiary_id']).toBeDefined());

    await waitFor(() => {
      selectCallbacks['beneficiary_id']('1');
    });

    const pointsInput = container.querySelector('input[name="points_earned"]') as HTMLInputElement;
    fireEvent.change(pointsInput, { target: { value: '500' } });
    expect(screen.getByText('500 pts')).toBeInTheDocument();
  });

  it('recalculates the points preview from the rule engine in sale mode', async () => {
    const client = makeOrgAwareClient({ rpcData: 100 });
    setClient(client);

    const { container } = render(<PurchaseForm />);
    fireEvent.click(screen.getAllByRole('radio')[1]);

    const amountInput = container.querySelector('input[name="total_amount"]') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '1000' } });

    await waitFor(() => expect(client._mockRpc).toHaveBeenCalledWith(
      'calculate_points_for_amount',
      expect.objectContaining({ p_amount: 1000 }),
    ));
    await waitFor(() => expect(screen.getByText('100 pts')).toBeInTheDocument());
  });

  it('zeroes the preview for a non-positive amount and clears it for junk input', async () => {
    const client = makeOrgAwareClient({ rpcData: 100 });
    setClient(client);

    const { container } = render(<PurchaseForm />);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    const amountInput = container.querySelector('input[name="total_amount"]') as HTMLInputElement;

    // Primero un importe válido, así el 0 tiene un preview previo que borrar.
    fireEvent.change(amountInput, { target: { value: '1000' } });
    await waitFor(() => expect(screen.getByText('100 pts')).toBeInTheDocument());

    fireEvent.change(amountInput, { target: { value: '0' } });
    await waitFor(() => expect(screen.getByText('0 pts')).toBeInTheDocument());
    expect(client._mockRpc).toHaveBeenCalledTimes(1);

    fireEvent.change(amountInput, { target: { value: '' } });
    await waitFor(() => expect(screen.getByText('0 pts')).toBeInTheDocument());
  });

  it('waits for the typing to settle and ignores the answer to a stale amount', async () => {
    const client = makeOrgAwareClient();
    let releaseStale: () => void = () => {};
    let calls = 0;
    client._mockRpc.mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        return new Promise<{ data: unknown; error: null }>((resolve) => {
          releaseStale = () => resolve({ data: 999, error: null });
        });
      }
      return Promise.resolve({ data: 7, error: null });
    });
    setClient(client);

    const { container } = render(<PurchaseForm />);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    const amountInput = container.querySelector('input[name="total_amount"]') as HTMLInputElement;

    // Tres teclas seguidas: sólo la última llega al motor de puntos.
    fireEvent.change(amountInput, { target: { value: '1' } });
    fireEvent.change(amountInput, { target: { value: '10' } });
    fireEvent.change(amountInput, { target: { value: '100' } });
    await waitFor(() => expect(client._mockRpc).toHaveBeenCalledTimes(1));
    expect(client._mockRpc).toHaveBeenCalledWith(
      'calculate_points_for_amount',
      expect.objectContaining({ p_amount: 100 }),
    );

    // El importe cambia con esa consulta en vuelo: su respuesta ya no vale.
    fireEvent.change(amountInput, { target: { value: '2000' } });
    releaseStale();

    await waitFor(() => expect(screen.getByText('7 pts')).toBeInTheDocument());
    expect(screen.queryByText('999 pts')).not.toBeInTheDocument();
  });

  it('recalculates when the branch changes', async () => {
    const client = makeOrgAwareClient({ rpcData: 42, branchData: [{ id: '3', name: 'Centro' }] });
    setClient(client);

    const { container } = render(<PurchaseForm />);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    const amountInput = container.querySelector('input[name="total_amount"]') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '500' } });

    await waitFor(() => expect(selectCallbacks['branch_id']).toBeDefined());
    await waitFor(() => { selectCallbacks['branch_id']('3'); });

    await waitFor(() => expect(client._mockRpc).toHaveBeenCalledWith(
      'calculate_points_for_amount',
      expect.objectContaining({ p_branch_id: 3 }),
    ));
  });

  it('stores the reason together with the observation in the notes field', async () => {
    setClient(makeOrgAwareClient());
    const { container } = render(<PurchaseForm />);

    await waitFor(() => expect(selectCallbacks['reason']).toBeDefined());
    await waitFor(() => { selectCallbacks['reason']('welcome'); });
    fireEvent.change(screen.getByPlaceholderText('notesPlaceholder'), {
      target: { value: 'Cliente nuevo' },
    });

    await waitFor(() =>
      expect(container.querySelector('input[name="notes"]')).toHaveValue(
        'reasons.welcome — Cliente nuevo',
      ),
    );
  });

  it('blocks the submit and surfaces validation errors on an empty form', async () => {
    setClient(makeOrgAwareClient());
    const { container } = render(<PurchaseForm />);
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText('Beneficiary is required')).toBeInTheDocument());
    expect(screen.getByText('Points are required')).toBeInTheDocument();
  });

  it('opens in sale mode when editing an operation that has an amount', async () => {
    setClient(makeOrgAwareClient());
    const { container } = render(
      <PurchaseForm
        purchase={{
          id: '9',
          purchase_number: 'PUR-009',
          beneficiary_id: '1',
          cashier_id: '2',
          branch_id: '3',
          total_amount: 1500,
          points_earned: 150,
          purchase_date: '2026-08-13T15:32:00Z',
          created_at: '2026-08-13T15:32:00Z',
          updated_at: '2026-08-13T15:32:00Z',
        }}
      />,
    );
    await waitFor(() => expect(container.querySelector('input[name="mode"]')).toHaveValue('sale'));
    expect(container.querySelector('input[name="id"]')).toHaveValue('9');
    expect(screen.getByRole('button', { name: 'submitSale' })).toBeInTheDocument();
  });

  it('lists the beneficiary recent activity once one is selected', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=7', configurable: true });
    const client = makeOrgAwareClient();
    client._mockFrom.mockImplementation((table: string) => {
      if (table === 'purchase') {
        return makeThenableBuilder([
          { id: '1', purchase_date: '2026-08-08T15:42:00Z', total_amount: 0, points_earned: 5000 },
          { id: '2', purchase_date: '2026-08-07T10:00:00Z', total_amount: 2500, points_earned: 250 },
        ]);
      }
      if (table === 'beneficiary_organization') {
        return makeThenableBuilder([{ available_points: 9500 }]);
      }
      return makeThenableBuilder([]);
    });
    setClient(client);

    render(<PurchaseForm />);
    await waitFor(() => expect(selectCallbacks['beneficiary_id']).toBeDefined());
    await waitFor(() => { selectCallbacks['beneficiary_id']('1'); });

    expect(await screen.findByText('activityAssignment')).toBeInTheDocument();
    expect(screen.getByText('activitySale')).toBeInTheDocument();
  });

  it('clears the balance and the activity when the beneficiary is deselected', async () => {
    setClient(makeOrgAwareClient());
    render(<PurchaseForm />);
    await waitFor(() => expect(selectCallbacks['beneficiary_id']).toBeDefined());

    await waitFor(() => { selectCallbacks['beneficiary_id']('1'); });
    await waitFor(() => { selectCallbacks['beneficiary_id'](''); });

    expect(screen.queryByText('activityTitle')).not.toBeInTheDocument();
  });

  it('ignores a cookie jar that cannot be read', async () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get() { throw new Error('blocked'); },
    });
    setClient(makeOrgAwareClient());
    const { container } = render(<PurchaseForm />);
    await waitFor(() => expect(container.querySelector('form')).toBeInTheDocument());
  });

  it('shows the beneficiary name in the summary once one is picked', async () => {
    setClient(makeOrgAwareClient({
      beneficiaryData: [{ id: '1', first_name: 'Ana', last_name: 'Diaz' }],
    }));
    render(<PurchaseForm />);
    await waitFor(() => expect(selectCallbacks['beneficiary_id']).toBeDefined());
    await waitFor(() => { selectCallbacks['beneficiary_id']('1'); });
    await waitFor(() => expect(screen.getAllByText('Ana Diaz').length).toBeGreaterThan(1));
  });

  it('copes with queries that come back empty', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=7', configurable: true });
    const client = makeOrgAwareClient({ rpcData: null });
    client._mockFrom.mockImplementation(() => {
      const b = makeThenableBuilder(null);
      b.eq = jest.fn(() => makeThenableBuilder(null));
      return b;
    });
    setClient(client);

    const { container } = render(<PurchaseForm />);
    await waitFor(() => expect(selectCallbacks['beneficiary_id']).toBeDefined());
    await waitFor(() => { selectCallbacks['beneficiary_id']('1'); });

    fireEvent.click(screen.getAllByRole('radio')[1]);
    const amountInput = container.querySelector('input[name="total_amount"]') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '1000' } });

    await waitFor(() => expect(client._mockRpc).toHaveBeenCalled());
    // Sin datos: cero puntos por la venta y cero de saldo resultante.
    await waitFor(() => expect(screen.getAllByText('0 pts')).toHaveLength(2));
  });

  it('stops loading the beneficiary when the form unmounts first', async () => {
    setClient(makeOrgAwareClient());
    const { unmount } = render(<PurchaseForm />);
    await waitFor(() => expect(selectCallbacks['beneficiary_id']).toBeDefined());
    await waitFor(() => { selectCallbacks['beneficiary_id']('1'); });
    unmount();
  });

  it('disables the submit button while the action is pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);
    setClient(makeOrgAwareClient());
    render(<PurchaseForm />);
    expect(screen.getByRole('button', { name: 'submitAssignment' })).toBeDisabled();
  });
});
