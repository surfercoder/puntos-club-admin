// Stand in for the Google widget and the uploader so this suite drives their
// callbacks directly; both have their own dedicated suites.
jest.mock('@/components/ui/google-address-autocomplete', () => ({
  GoogleAddressAutocomplete: ({
    onPlaceSelected,
    id,
    defaultValue,
  }: {
    onPlaceSelected: (p: Record<string, unknown>) => void;
    id?: string;
    defaultValue?: string;
  }) => (
    <button
      data-default={defaultValue}
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
          formatted_address: 'Av. Corrientes 1234, CABA',
          place_id: 'place-1',
          latitude: -34.6,
          longitude: -58.4,
        })
      }
    />
  ),
}));
jest.mock('@/components/ui/image-upload', () => ({
  ImageUpload: ({ value, onChange }: { value: string | null; onChange: (u: string | null) => void }) => (
    <div>
      <span data-testid="logo-value">{value ?? 'none'}</span>
      <button type="button" onClick={() => onChange('https://cdn/logo.png')}>set-logo</button>
    </div>
  ),
}));

import { fireEvent, render, screen } from '@testing-library/react';

import { Step2Company } from '@/components/onboarding/steps/step-2-company';

const VALID_PASSWORD = 'Contrase1!';

const renderStep = (props: Partial<React.ComponentProps<typeof Step2Company>> = {}) => {
  const onNext = jest.fn();
  const onBack = jest.fn();
  render(<Step2Company onBack={onBack} onNext={onNext} {...props} />);
  return { onNext, onBack };
};

const submit = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

const fillRequired = () => {
  fireEvent.change(screen.getByLabelText(/businessName/), { target: { value: 'Kiosco Ana' } });
  fireEvent.change(screen.getByLabelText(/branchName/), { target: { value: 'Centro' } });
  fireEvent.click(screen.getByTestId('pick-place'));
};

const openCashier = () => fireEvent.click(screen.getByText('createCashier'));

const fillCashier = (overrides: Partial<Record<string, string>> = {}) => {
  const values = {
    email: 'caja@example.com',
    password: VALID_PASSWORD,
    confirm: VALID_PASSWORD,
    ...overrides,
  };
  fireEvent.change(screen.getByLabelText(/cashierEmail/), { target: { value: values.email } });
  fireEvent.change(screen.getByLabelText(/^password/), { target: { value: values.password } });
  fireEvent.change(screen.getByLabelText(/confirmPassword/), { target: { value: values.confirm } });
};

const savedData = {
  org: { name: 'Kiosco Ana', business_name: 'Ana SRL', tax_id: '20-1', logo_url: 'https://cdn/l.png' },
  branch: { name: 'Centro', phone: '1122' },
  address: {
    street: 'Av. Corrientes',
    number: '1234',
    city: 'Buenos Aires',
    state: 'CABA',
    zip_code: 'C1043',
    country: 'Argentina',
    formatted_address: 'Av. Corrientes 1234',
    place_id: 'place-1',
    latitude: -34.6,
    longitude: -58.4,
  },
  cashier: { email: 'caja@example.com', password: VALID_PASSWORD, first_name: 'Caja', last_name: 'Uno' },
} as never;

describe('Step2Company', () => {
  it('starts empty with the cashier section collapsed', () => {
    renderStep();

    expect(screen.getByLabelText(/businessName/)).toHaveValue('');
    expect(screen.queryByLabelText(/cashierEmail/)).not.toBeInTheDocument();
    expect(screen.getByTestId('logo-value')).toHaveTextContent('none');
  });

  it('restores everything from a saved step 2, cashier expanded', () => {
    renderStep({ initialData: savedData });

    expect(screen.getByLabelText(/businessName/)).toHaveValue('Kiosco Ana');
    expect(screen.getByLabelText(/legalName/)).toHaveValue('Ana SRL');
    expect(screen.getByLabelText(/taxId/)).toHaveValue('20-1');
    expect(screen.getByLabelText(/branchName/)).toHaveValue('Centro');
    expect(screen.getByLabelText(/branchPhone/)).toHaveValue('1122');
    expect(screen.getByTestId('logo-value')).toHaveTextContent('https://cdn/l.png');
    expect(screen.getByTestId('pick-place')).toHaveAttribute('data-default', 'Av. Corrientes 1234');
    expect(screen.getByLabelText(/cashierEmail/)).toHaveValue('caja@example.com');
  });

  it('restores an address that carries only its required parts', () => {
    renderStep({
      initialData: {
        ...savedData,
        cashier: undefined,
        address: {
          street: 'Av. Corrientes',
          number: '1234',
          city: 'Buenos Aires',
          state: 'CABA',
          zip_code: 'C1043',
        },
      } as never,
    });

    expect(screen.getByTestId('pick-place')).toHaveAttribute('data-default', '');
    expect(screen.queryByLabelText(/cashierEmail/)).not.toBeInTheDocument();
  });

  it('starts with no address when the saved payload has none', () => {
    renderStep({ initialData: { ...savedData, address: undefined, cashier: undefined } as never });
    expect(screen.getByTestId('pick-place')).toHaveAttribute('data-default', '');
  });

  it('reports the required fields instead of submitting', () => {
    const { onNext } = renderStep();

    submit();

    expect(screen.getByText('validation.businessNameRequired')).toBeInTheDocument();
    expect(screen.getByText('validation.branchNameRequired')).toBeInTheDocument();
    expect(screen.getByText('validation.branchAddressRequired')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('shows the picked address back to the user', () => {
    renderStep();
    fireEvent.click(screen.getByTestId('pick-place'));
    expect(screen.getByText(/Av. Corrientes 1234, CABA/)).toBeInTheDocument();
  });

  it('submits the minimum viable business', () => {
    const { onNext } = renderStep();
    fillRequired();

    submit();

    expect(onNext).toHaveBeenCalledWith({
      org: { name: 'Kiosco Ana', business_name: undefined, tax_id: undefined, logo_url: undefined },
      address: {
        street: 'Av. Corrientes',
        number: '1234',
        city: 'Buenos Aires',
        state: 'CABA',
        zip_code: 'C1043',
        country: 'Argentina',
        place_id: 'place-1',
        latitude: -34.6,
        longitude: -58.4,
        formatted_address: 'Av. Corrientes 1234, CABA',
      },
      branch: { name: 'Centro', phone: undefined },
      cashier: undefined,
    });
  });

  it('includes the optional business details and logo when given', () => {
    const { onNext } = renderStep();
    fillRequired();
    fireEvent.change(screen.getByLabelText(/legalName/), { target: { value: '  Ana SRL  ' } });
    fireEvent.change(screen.getByLabelText(/taxId/), { target: { value: '  20-1  ' } });
    fireEvent.change(screen.getByLabelText(/branchPhone/), { target: { value: '  1122  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'set-logo' }));

    submit();

    expect(onNext.mock.calls[0][0].org).toEqual({
      name: 'Kiosco Ana',
      business_name: 'Ana SRL',
      tax_id: '20-1',
      logo_url: 'https://cdn/logo.png',
    });
    expect(onNext.mock.calls[0][0].branch.phone).toBe('1122');
  });

  it('goes back to the previous step', () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('toggles the cashier section open and closed', () => {
    renderStep();

    openCashier();
    expect(screen.getByLabelText(/cashierEmail/)).toBeInTheDocument();

    openCashier();
    expect(screen.queryByLabelText(/cashierEmail/)).not.toBeInTheDocument();
  });

  it('submits without a cashier when the section was opened but left blank', () => {
    const { onNext } = renderStep();
    fillRequired();
    openCashier();

    submit();

    expect(onNext.mock.calls[0][0].cashier).toBeUndefined();
  });

  it('submits the cashier once it is filled in', () => {
    const { onNext } = renderStep();
    fillRequired();
    openCashier();
    fillCashier();
    fireEvent.change(screen.getByLabelText(/^name/), { target: { value: '  Caja  ' } });
    fireEvent.change(screen.getByLabelText(/lastName/), { target: { value: '  Uno  ' } });

    submit();

    expect(onNext.mock.calls[0][0].cashier).toEqual({
      email: 'caja@example.com',
      password: VALID_PASSWORD,
      first_name: 'Caja',
      last_name: 'Uno',
    });
  });

  it('omits the cashier name fields when left blank', () => {
    const { onNext } = renderStep();
    fillRequired();
    openCashier();
    fillCashier();

    submit();

    expect(onNext.mock.calls[0][0].cashier).toMatchObject({
      first_name: undefined,
      last_name: undefined,
    });
  });

  it('requires an email once any cashier field is touched', () => {
    const { onNext } = renderStep();
    fillRequired();
    openCashier();
    fireEvent.change(screen.getByLabelText(/^name/), { target: { value: 'Caja' } });

    submit();

    expect(screen.getByText('validation.cashierEmailRequired')).toBeInTheDocument();
    expect(screen.getByText('validation.passwordRequired')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('rejects a malformed cashier email', () => {
    const { onNext } = renderStep();
    fillRequired();
    openCashier();
    fillCashier({ email: 'no-arroba' });

    submit();

    expect(screen.getByText('validation.cashierEmailInvalid')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('rejects a weak cashier password', () => {
    const { onNext } = renderStep();
    fillRequired();
    openCashier();
    fillCashier({ password: 'debil', confirm: 'debil' });

    submit();

    expect(screen.getByText('validation.passwordWeak')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('rejects mismatched cashier passwords', () => {
    const { onNext } = renderStep();
    fillRequired();
    openCashier();
    fillCashier({ confirm: 'Otra1234!' });

    submit();

    expect(screen.getByText('validation.passwordsMismatch')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('toggles visibility of both cashier password fields', () => {
    renderStep();
    openCashier();

    const password = screen.getByLabelText(/^password/);
    const confirm = screen.getByLabelText(/confirmPassword/);
    expect(password).toHaveAttribute('type', 'password');
    expect(confirm).toHaveAttribute('type', 'password');

    const [showPassword, showConfirm] = screen.getAllByRole('button', { name: 'Mostrar contraseña' });
    fireEvent.click(showPassword);
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(showConfirm);
    expect(confirm).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getAllByRole('button', { name: 'Ocultar contraseña' })[0]);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('clears the previous errors once the form is corrected', () => {
    const { onNext } = renderStep();

    submit();
    expect(screen.getByText('validation.businessNameRequired')).toBeInTheDocument();

    fillRequired();
    submit();

    expect(screen.queryByText('validation.businessNameRequired')).not.toBeInTheDocument();
    expect(onNext).toHaveBeenCalled();
  });
});
