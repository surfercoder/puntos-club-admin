jest.mock('@/actions/dashboard/branch/branch-with-address-form-actions', () => ({
  branchWithAddressFormAction: jest.fn(),
}));

// Stand in for the Google widget so a test can drive a place selection directly.
jest.mock('@/components/ui/google-address-autocomplete', () => ({
  GoogleAddressAutocomplete: ({
    onPlaceSelected,
    id,
    placeholder,
  }: {
    onPlaceSelected: (c: Record<string, unknown>) => void;
    id?: string;
    placeholder?: string;
  }) => (
    <button
      data-testid="pick-place"
      id={id}
      type="button"
      onClick={() =>
        onPlaceSelected({
          street: 'Av. Corrientes',
          number: '1234',
          city: 'Buenos Aires',
          state: 'CABA',
          zip_code: 'C1043',
          country: 'Argentina',
          place_id: 'place-1',
          latitude: -34.6,
          longitude: -58.4,
        })
      }
    >
      {placeholder}
    </button>
  ),
}));

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { branchWithAddressFormAction } from '@/actions/dashboard/branch/branch-with-address-form-actions';
import BranchFormWithAddress from '@/components/dashboard/branch/branch-form-with-address';

const push = jest.fn();

/** The action the component handed to useActionState on its last render. */
const wrappedAction = () =>
  (useActionState as jest.Mock).mock.calls.at(-1)[0] as (
    state: unknown,
    formData: FormData,
  ) => Promise<{ status: string; message?: string }>;

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText('nameLabel'), { target: { value: 'Sucursal Centro' } });
  fireEvent.click(screen.getByTestId('pick-place'));
};

describe('BranchFormWithAddress', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useActionState as jest.Mock).mockImplementation(() => [
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
    jest.mocked(branchWithAddressFormAction).mockResolvedValue({ status: 'success', message: 'Creada' });
  });

  it('renders empty for a new branch and labels the submit as create', () => {
    render(<BranchFormWithAddress />);

    expect(screen.getByLabelText('nameLabel')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
    expect(document.querySelector('input[name="id"]')).not.toBeInTheDocument();
  });

  it('prefills from an existing branch and labels the submit as update', () => {
    render(
      <BranchFormWithAddress
        branch={{ id: '7', name: 'Centro', phone: '1122', active: false, address_id: 'a1' }}
      />,
    );

    expect(screen.getByLabelText('nameLabel')).toHaveValue('Centro');
    expect(screen.getByLabelText('phoneLabel')).toHaveValue('1122');
    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
    expect(document.querySelector('input[name="id"]')).toHaveValue('7');
    expect(screen.getByLabelText('statusLabel')).toHaveValue('false');
  });

  it('defaults a branch with no explicit active flag to active', () => {
    render(<BranchFormWithAddress branch={{ id: '7', name: 'Centro', address_id: 'a1' }} />);
    expect(screen.getByLabelText('statusLabel')).toHaveValue('true');
  });

  it('mirrors the status select into the hidden active field', () => {
    render(<BranchFormWithAddress />);
    expect(document.querySelector('input[name="active"]')).toHaveValue('true');

    fireEvent.change(screen.getByLabelText('statusLabel'), { target: { value: 'false' } });
    expect(document.querySelector('input[name="active"]')).toHaveValue('false');
  });

  it('fills the address fields from the selected place', () => {
    render(<BranchFormWithAddress />);

    fireEvent.click(screen.getByTestId('pick-place'));

    expect(screen.getByLabelText('street')).toHaveValue('Av. Corrientes');
    expect(screen.getByLabelText('number')).toHaveValue('1234');
    expect(screen.getByLabelText('city')).toHaveValue('Buenos Aires');
    expect(screen.getByLabelText('state')).toHaveValue('CABA');
    expect(screen.getByLabelText('zipCode')).toHaveValue('C1043');
    expect(document.querySelector('input[name="country"]')).toHaveValue('Argentina');
    expect(document.querySelector('input[name="place_id"]')).toHaveValue('place-1');
    expect(document.querySelector('input[name="latitude"]')).toHaveValue('-34.6');
    expect(document.querySelector('input[name="longitude"]')).toHaveValue('-58.4');
  });

  it('omits the hidden geo fields until a place is chosen', () => {
    render(<BranchFormWithAddress />);

    for (const name of ['country', 'place_id', 'latitude', 'longitude']) {
      expect(document.querySelector(`input[name="${name}"]`)).not.toBeInTheDocument();
    }
  });

  it.each(['street', 'number', 'city', 'state', 'zipCode'])(
    'lets the user correct the %s field by hand',
    (label) => {
      render(<BranchFormWithAddress />);
      fireEvent.click(screen.getByTestId('pick-place'));

      fireEvent.change(screen.getByLabelText(label), { target: { value: 'corregido' } });
      expect(screen.getByLabelText(label)).toHaveValue('corregido');
    },
  );

  it('surfaces the missing address fields instead of submitting', () => {
    render(<BranchFormWithAddress />);

    fireEvent.change(screen.getByLabelText('nameLabel'), { target: { value: 'Centro' } });
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    // AddressSchema rejects every blank address field
    expect(screen.getByText('Street is required')).toBeInTheDocument();
    expect(screen.getByText('City is required')).toBeInTheDocument();
    expect(screen.getByText('Number is required')).toBeInTheDocument();
    expect(screen.getByText('State is required')).toBeInTheDocument();
    expect(screen.getByText('Zip code is required')).toBeInTheDocument();
  });

  it('raises no client-side errors once the form is complete', () => {
    render(<BranchFormWithAddress />);
    fillRequiredFields();

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    expect(document.querySelector('.text-destructive')).not.toBeInTheDocument();
  });

  it('clears a previous round of errors when the form is resubmitted valid', () => {
    render(<BranchFormWithAddress />);

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    expect(screen.getByText('Street is required')).toBeInTheDocument();

    fillRequiredFields();
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    expect(screen.queryByText('Street is required')).not.toBeInTheDocument();
  });

  it('toasts and navigates back to the list after a successful save', async () => {
    jest.useFakeTimers();
    render(<BranchFormWithAddress />);

    await act(async () => {
      await wrappedAction()({}, new FormData());
    });

    expect(toast.success).toHaveBeenCalledWith('Creada');
    act(() => jest.advanceTimersByTime(500));
    expect(push).toHaveBeenCalledWith('/dashboard/branch');
    jest.useRealTimers();
  });

  it('toasts the server error message and stays on the form', async () => {
    jest.mocked(branchWithAddressFormAction).mockResolvedValue({ status: 'error', message: 'Nombre repetido' });
    render(<BranchFormWithAddress />);

    await act(async () => {
      await wrappedAction()({}, new FormData());
    });

    expect(toast.error).toHaveBeenCalledWith('Nombre repetido');
    expect(push).not.toHaveBeenCalled();
  });

  it('stays silent when the action errors without a message', async () => {
    jest.mocked(branchWithAddressFormAction).mockResolvedValue({ status: 'error' });
    render(<BranchFormWithAddress />);

    await act(async () => {
      await wrappedAction()({}, new FormData());
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('disables the submit button while the action is pending', () => {
    (useActionState as jest.Mock).mockImplementation(() => [
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);
    render(<BranchFormWithAddress />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('marks the fields the server rejected as invalid', async () => {
    (useActionState as jest.Mock).mockImplementation(() => [
      { status: 'error', message: 'Inválido', fieldErrors: { street: ['requerido'], active: ['requerido'] } },
      jest.fn(),
      false,
    ]);
    render(<BranchFormWithAddress />);

    await waitFor(() => {
      expect(screen.getByLabelText('street')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('statusLabel')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
