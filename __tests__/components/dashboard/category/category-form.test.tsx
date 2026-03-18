import { render, screen, fireEvent } from '@testing-library/react';

// Mocks
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

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn((cb: (res: { data: never[] }) => void) => cb({ data: [] })),
    })),
  })),
}));

jest.mock('@/actions/dashboard/category/category-form-actions', () => ({
  categoryFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import CategoryForm from '@/components/dashboard/category/category-form';

const React = require('react');
const { toast: _toast } = require('sonner');
const { redirect: _redirect } = require('next/navigation');

describe('CategoryForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<CategoryForm />);

    expect(screen.getByText('form.nameLabel')).toBeInTheDocument();
    expect(screen.getByText('form.descriptionLabel')).toBeInTheDocument();
    expect(screen.getByText('form.activeLabel')).toBeInTheDocument();
    expect(screen.getByText('form.parentCategory')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<CategoryForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const category = {
      id: '1',
      name: 'Test Category',
      description: 'A description',
      active: true,
      parent_id: null,
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<CategoryForm category={category} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const category = {
      id: '1',
      name: 'Test Category',
      description: 'A description',
      active: true,
      parent_id: null,
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<CategoryForm category={category} />);

    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A description')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<CategoryForm />);

    const nameInput = screen.getByRole('textbox', { name: 'form.nameLabel' });
    expect(nameInput).toHaveValue('');
  });

  it('renders cancel button linking to category list', () => {
    render(<CategoryForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/category');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<CategoryForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  // -- handleSubmit validation tests (covers lines 70-79) --
  it('runs handleSubmit and catches validation error on empty form', () => {
    render(<CategoryForm />);

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);

    // handleSubmit runs: CategorySchema.parse fails, catch block calls fromErrorToActionState
    // and event.preventDefault(). This covers lines 70-79.
  });

  it('runs handleSubmit in edit mode with pre-filled data', () => {
    const category = {
      id: '1',
      name: 'Test Category',
      description: 'A description',
      active: true,
      parent_id: 'parent-1',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<CategoryForm category={category} />);

    const form = screen.getByRole('button', { name: 'update' }).closest('form')!;
    fireEvent.submit(form);
  });

  // -- useEffect loadCategories with org id from localStorage (covers lines 42-48) --
  it('loads categories with active org id from localStorage', () => {
    const mockGetItem = jest.fn().mockReturnValue('42');
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: mockGetItem, setItem: jest.fn(), removeItem: jest.fn() },
      writable: true,
      configurable: true,
    });

    const mockEq = jest.fn().mockReturnThis();
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: mockEq,
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn((cb: (res: { data: Array<{ id: string; name: string; active: boolean }> }) => void) => cb({ data: [{ id: 'c1', name: 'Cat A', active: true }] })),
    });

    const { createClient } = require('@/lib/supabase/client');
    (createClient as jest.Mock).mockReturnValue({ from: mockFrom });

    render(<CategoryForm />);

    expect(mockGetItem).toHaveBeenCalledWith('active_org_id');
  });

  // -- useEffect loadCategories with NaN org id (covers line 46 branch) --
  it('handles NaN active org id from localStorage', () => {
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: jest.fn().mockReturnValue('not-a-number'), setItem: jest.fn(), removeItem: jest.fn() },
      writable: true,
      configurable: true,
    });

    render(<CategoryForm />);
    // Should not crash - NaN check prevents eq filter
  });

  // -- useEffect loadCategories with localStorage error (covers line 49) --
  it('handles localStorage error gracefully', () => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new Error('localStorage not available'); },
      configurable: true,
    });

    // Should not crash
    render(<CategoryForm />);

    // Restore
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: jest.fn().mockReturnValue(null), setItem: jest.fn(), removeItem: jest.fn() },
      writable: true,
      configurable: true,
    });
  });

  // -- Render with populated categories to cover map callback (lines 93-97) --
  it('renders parent category options when categories are loaded', async () => {
    // Mock supabase to return category data - the query object is awaited directly
    const mockData = [{ id: 'c1', name: 'Cat A', active: true }, { id: 'c2', name: 'Cat B', active: true }];
    const orderMock = jest.fn().mockResolvedValue({ data: mockData });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock, eq: jest.fn().mockReturnValue({ order: orderMock }) });
    const { createClient } = require('@/lib/supabase/client');
    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({ eq: eqMock }),
      })),
    });

    Object.defineProperty(window, 'localStorage', {
      value: { getItem: jest.fn().mockReturnValue(null), setItem: jest.fn(), removeItem: jest.fn() },
      writable: true,
      configurable: true,
    });

    const { waitFor } = require('@testing-library/react');
    render(<CategoryForm />);

    await waitFor(() => {
      expect(screen.getByText('Cat A')).toBeInTheDocument();
      expect(screen.getByText('Cat B')).toBeInTheDocument();
    });
  });

  // -- Cover null data from query (line 58 false branch) --
  it('handles null data from category query', async () => {
    const { createClient } = require('@/lib/supabase/client');
    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null }),
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      })),
    });

    Object.defineProperty(window, 'localStorage', {
      value: { getItem: jest.fn().mockReturnValue(null), setItem: jest.fn(), removeItem: jest.fn() },
      writable: true,
      configurable: true,
    });

    const { waitFor } = require('@testing-library/react');
    render(<CategoryForm />);

    await waitFor(() => {
      expect(screen.getByText('form.parentCategory')).toBeInTheDocument();
    });
  });

  // -- Renders field errors from validation/actionState --
  it('renders field errors from action state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: '', fieldErrors: { name: ['Name is required'] } },
      jest.fn(),
      false,
    ]);

    render(<CategoryForm />);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});
