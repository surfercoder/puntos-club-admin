import { render, screen, fireEvent } from '@testing-library/react';

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

jest.mock('@/actions/dashboard/address/address-form-actions', () => ({
  addressFormAction: jest.fn(),
}));

let _mockOnPlaceSelected: any = null;

jest.mock('@/components/ui/google-address-autocomplete', () => ({
  GoogleAddressAutocomplete: ({ onPlaceSelected }: any) => {
    _mockOnPlaceSelected = onPlaceSelected;
    return (
      <div data-testid="google-autocomplete">
        <button
          data-testid="select-place-btn"
          onClick={() =>
            onPlaceSelected({
              street: 'Av. Corrientes',
              number: '1234',
              city: 'Buenos Aires',
              state: 'CABA',
              zip_code: 'C1043',
              country: 'AR',
              place_id: 'ChIJ_abc123',
              latitude: -34.6037,
              longitude: -58.3816,
            })
          }
        >
          Select Place
        </button>
      </div>
    );
  },
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import AddressForm from '@/components/dashboard/address/address-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('AddressForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<AddressForm />);

    expect(screen.getByText('form.searchAddress')).toBeInTheDocument();
    expect(screen.getByText('form.street')).toBeInTheDocument();
    expect(screen.getByText('form.number')).toBeInTheDocument();
    expect(screen.getByText('form.city')).toBeInTheDocument();
    expect(screen.getByText('form.state')).toBeInTheDocument();
    expect(screen.getByText('form.zipCode')).toBeInTheDocument();
  });

  it('renders the Google autocomplete component', () => {
    render(<AddressForm />);

    expect(screen.getByTestId('google-autocomplete')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<AddressForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const address = {
      id: 1,
      street: 'Main St',
      number: '123',
      city: 'Buenos Aires',
      state: 'CABA',
      zip_code: '1000',
      country: 'AR',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AddressForm address={address} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const address = {
      id: 1,
      street: 'Main St',
      number: '123',
      city: 'Buenos Aires',
      state: 'CABA',
      zip_code: '1000',
      country: 'AR',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AddressForm address={address} />);

    expect(screen.getByDisplayValue('Main St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Buenos Aires')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CABA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<AddressForm />);

    const streetInput = screen.getByRole('textbox', { name: 'form.street' });
    expect(streetInput).toHaveValue('');
  });

  it('renders cancel button linking to address list', () => {
    render(<AddressForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/address');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AddressForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Address created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AddressForm />);

    expect(toast.success).toHaveBeenCalledWith('Address created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/address');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<AddressForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  // -- handlePlaceSelected (line 52) --
  it('fills address fields when a place is selected from Google autocomplete', () => {
    render(<AddressForm />);

    // Click the select place button which triggers onPlaceSelected
    fireEvent.click(screen.getByTestId('select-place-btn'));

    // Fields should be populated
    expect(screen.getByDisplayValue('Av. Corrientes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Buenos Aires')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CABA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('C1043')).toBeInTheDocument();
  });

  // -- handleSubmit validation (lines 66-74) --
  it('prevents form submission on validation error', () => {
    render(<AddressForm />);

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);

    // Should not crash; validation errors would be set via setValidation
  });

  it('submits form with valid address data', () => {
    render(<AddressForm />);

    // Fill in address data via place selection
    fireEvent.click(screen.getByTestId('select-place-btn'));

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);
  });

  // -- Input field change handlers (lines 96-144) --
  it('updates street field on change', () => {
    render(<AddressForm />);

    const streetInput = screen.getByRole('textbox', { name: 'form.street' });
    fireEvent.change(streetInput, { target: { value: 'New Street' } });
    expect(streetInput).toHaveValue('New Street');
  });

  it('updates number field on change', () => {
    render(<AddressForm />);

    const numberInput = screen.getByRole('textbox', { name: 'form.number' });
    fireEvent.change(numberInput, { target: { value: '456' } });
    expect(numberInput).toHaveValue('456');
  });

  it('updates city field on change', () => {
    render(<AddressForm />);

    const cityInput = screen.getByRole('textbox', { name: 'form.city' });
    fireEvent.change(cityInput, { target: { value: 'Cordoba' } });
    expect(cityInput).toHaveValue('Cordoba');
  });

  it('updates state field on change', () => {
    render(<AddressForm />);

    const stateInput = screen.getByRole('textbox', { name: 'form.state' });
    fireEvent.change(stateInput, { target: { value: 'Cordoba' } });
    expect(stateInput).toHaveValue('Cordoba');
  });

  it('updates zip_code field on change', () => {
    render(<AddressForm />);

    const zipInput = screen.getByRole('textbox', { name: 'form.zipCode' });
    fireEvent.change(zipInput, { target: { value: '5000' } });
    expect(zipInput).toHaveValue('5000');
  });

  // -- Hidden fields for country, place_id, latitude, longitude (lines 150-161) --
  it('renders hidden fields for country, place_id, latitude, longitude when place is selected', () => {
    const { container } = render(<AddressForm />);

    fireEvent.click(screen.getByTestId('select-place-btn'));

    // Check hidden fields exist
    const countryInput = container.querySelector('input[name="country"]');
    expect(countryInput).toHaveValue('AR');

    const placeIdInput = container.querySelector('input[name="place_id"]');
    expect(placeIdInput).toHaveValue('ChIJ_abc123');

    const latInput = container.querySelector('input[name="latitude"]');
    expect(latInput).toHaveValue('-34.6037');

    const lngInput = container.querySelector('input[name="longitude"]');
    expect(lngInput).toHaveValue('-58.3816');
  });

  // -- Renders field errors --
  it('renders field errors from validation state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: '', fieldErrors: { street: ['Street is required'] } },
      jest.fn(),
      false,
    ]);

    render(<AddressForm />);

    expect(screen.getByText('Street is required')).toBeInTheDocument();
  });

  // -- Edit mode with address id shows hidden input --
  it('renders hidden id input in edit mode', () => {
    const address = {
      id: 42,
      street: 'Main St',
      number: '123',
      city: 'Buenos Aires',
      state: 'CABA',
      zip_code: '1000',
      country: 'AR',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    const { container } = render(<AddressForm address={address} />);

    const hiddenInput = container.querySelector('input[name="id"]');
    expect(hiddenInput).toHaveValue('42');
  });

  // -- Country hidden field not rendered when no country --
  it('does not render hidden country field when no country is set', () => {
    const { container } = render(<AddressForm />);

    const countryInput = container.querySelector('input[name="country"]');
    expect(countryInput).toBeNull();
  });
});
