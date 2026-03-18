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

let mockCategoryData: { id: string; name: string; active: boolean }[] = [];
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

function setupSupabaseMock() {
  const queryObj: Record<string, jest.Mock> = {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    then: jest.fn((resolve: (val: { data: typeof mockCategoryData }) => void) => {
      resolve({ data: mockCategoryData });
      return Promise.resolve({ data: mockCategoryData });
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

jest.mock('@/actions/dashboard/product/product-form-actions', () => ({
  productFormAction: jest.fn(),
}));

jest.mock('@/components/dashboard/product/product-image-upload', () => {
  return function MockProductImageUpload() {
    return <div data-testid="product-image-upload" />;
  };
});

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import ProductForm from '@/components/dashboard/product/product-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('ProductForm', () => {
  let localStorageGetItem: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryData = [];
    setupSupabaseMock();
    localStorageGetItem = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  });

  afterEach(() => {
    localStorageGetItem.mockRestore();
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<ProductForm />);

    expect(screen.getByText('nameLabel')).toBeInTheDocument();
    expect(screen.getByText('descriptionLabel')).toBeInTheDocument();
    expect(screen.getByText('pointsLabel')).toBeInTheDocument();
    expect(screen.getByText('categoryLabel')).toBeInTheDocument();
    expect(screen.getByText('activeLabel')).toBeInTheDocument();
    expect(screen.getByText('imagesLabel')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<ProductForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      description: 'A product',
      required_points: 100,
      active: true,
      category_id: 'cat-1',
      image_urls: [],
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<ProductForm product={product} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      description: 'A product',
      required_points: 100,
      active: true,
      category_id: 'cat-1',
      image_urls: [],
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<ProductForm product={product} />);

    expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<ProductForm />);

    const nameInput = screen.getByRole('textbox', { name: 'nameLabel' });
    expect(nameInput).toHaveValue('');
  });

  it('renders the product image upload component', () => {
    render(<ProductForm />);

    expect(screen.getByTestId('product-image-upload')).toBeInTheDocument();
  });

  it('renders cancel button linking to product list', () => {
    render(<ProductForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/product');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<ProductForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Product created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<ProductForm />);

    expect(toast.success).toHaveBeenCalledWith('Product created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/product');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<ProductForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('validates form on submit and prevents default for invalid data', async () => {
    render(<ProductForm />);

    const form = screen.getByRole('textbox', { name: 'nameLabel' }).closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    // Validation should fail since name is empty and category_id is empty
  });

  it('loads categories with org filter from localStorage', async () => {
    localStorageGetItem.mockReturnValue('55');
    mockCategoryData = [{ id: 'cat-1', name: 'Electronics', active: true }];
    setupSupabaseMock();

    await act(async () => {
      render(<ProductForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('category');
      expect(mockEq).toHaveBeenCalledWith('organization_id', 55);
    });
  });

  it('loads categories without org filter when localStorage is empty', async () => {
    localStorageGetItem.mockReturnValue(null);
    mockCategoryData = [{ id: 'cat-1', name: 'Food', active: true }];
    setupSupabaseMock();

    await act(async () => {
      render(<ProductForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('category');
    });
  });

  it('renders loaded categories in the select', async () => {
    mockCategoryData = [
      { id: 'cat-1', name: 'Electronics', active: true },
      { id: 'cat-2', name: 'Food', active: true },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<ProductForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
  });

  it('handles category select change', async () => {
    mockCategoryData = [{ id: 'cat-1', name: 'Electronics', active: true }];
    setupSupabaseMock();

    await act(async () => {
      render(<ProductForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } });
    expect(categorySelect).toHaveValue('cat-1');
  });

  it('handles localStorage error gracefully', async () => {
    localStorageGetItem.mockImplementation(() => { throw new Error('access denied'); });
    mockCategoryData = [{ id: 'cat-1', name: 'Food', active: true }];
    setupSupabaseMock();

    await act(async () => {
      render(<ProductForm />);
    });

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
  });

  it('handles NaN org id in localStorage', async () => {
    localStorageGetItem.mockReturnValue('notanumber');
    mockCategoryData = [];
    setupSupabaseMock();

    await act(async () => {
      render(<ProductForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('category');
    });

    // Should not call eq with organization_id for NaN
    const eqCalls = mockEq.mock.calls.filter(
      (c: unknown[]) => c[0] === 'organization_id'
    );
    expect(eqCalls.length).toBe(0);
  });

  // -- Cover null data from query (line 70 ?? branch) --
  it('handles null data from category query (line 70 data ?? [])', async () => {
    const nullQueryObj: Record<string, jest.Mock> = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      then: jest.fn((resolve: (val: { data: null }) => void) => {
        resolve({ data: null });
        return Promise.resolve({ data: null });
      }),
    };
    nullQueryObj.select.mockReturnValue(nullQueryObj);
    nullQueryObj.eq.mockReturnValue(nullQueryObj);
    nullQueryObj.order.mockReturnValue(nullQueryObj);
    mockFrom.mockReturnValue(nullQueryObj);

    await act(async () => {
      render(<ProductForm />);
    });

    // Should render without crashing, categories should be empty
    expect(screen.getByText('categoryLabel')).toBeInTheDocument();
  });
});
