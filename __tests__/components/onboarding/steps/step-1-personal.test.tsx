jest.mock('@/actions/onboarding/initiate-registration', () => ({ initiateRegistration: jest.fn() }));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { initiateRegistration } from '@/actions/onboarding/initiate-registration';
import { Step1Personal } from '@/components/onboarding/steps/step-1-personal';
import { LS_EMAIL, LS_FIRST_NAME, LS_LAST_NAME, LS_PLAN } from '@/lib/onboarding-storage';

const VALID_PASSWORD = 'Contrase1!';

const fillForm = (overrides: Partial<Record<string, string>> = {}) => {
  const values = {
    name: 'Ana',
    lastName: 'Gómez',
    email: 'ana@example.com',
    password: VALID_PASSWORD,
    ...overrides,
  };
  fireEvent.change(screen.getByLabelText('name'), { target: { value: values.name } });
  fireEvent.change(screen.getByLabelText('lastName'), { target: { value: values.lastName } });
  fireEvent.change(screen.getByLabelText('email'), { target: { value: values.email } });
  fireEvent.change(screen.getByLabelText('password'), { target: { value: values.password } });
};

const submit = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

describe('Step1Personal completed view', () => {
  it('summarises the verified user and continues on click', () => {
    const onNext = jest.fn();
    render(
      <Step1Personal
        completedData={{ firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com' }}
        onNext={onNext}
      />,
    );

    expect(screen.getByText('emailVerified')).toBeInTheDocument();
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('AG')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'continueSetup' }));
    expect(onNext).toHaveBeenCalledWith();
  });

  it('falls back to an icon when the name yields no initials', () => {
    render(
      <Step1Personal completedData={{ firstName: '', lastName: '', email: 'ana@example.com' }} onNext={jest.fn()} />,
    );
    expect(screen.queryByText('AG')).not.toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });
});

describe('Step1Personal registration form', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.mocked(initiateRegistration).mockResolvedValue({ success: true });
  });

  it('renders the form when there is nothing completed yet', () => {
    render(<Step1Personal onNext={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'submitButton' })).toBeInTheDocument();
  });

  it('reports every missing field instead of submitting', async () => {
    render(<Step1Personal onNext={jest.fn()} />);

    submit();

    expect(await screen.findByText('firstNameRequired')).toBeInTheDocument();
    expect(screen.getByText('lastNameRequired')).toBeInTheDocument();
    expect(screen.getAllByText('email').length).toBeGreaterThan(1);
    expect(initiateRegistration).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm({ email: 'no-arroba' });

    submit();

    await waitFor(() => expect(initiateRegistration).not.toHaveBeenCalled());
  });

  it('rejects a password that fails the strength rules', async () => {
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm({ password: 'debil' });

    submit();

    expect(await screen.findByText('passwordWeak')).toBeInTheDocument();
    expect(initiateRegistration).not.toHaveBeenCalled();
  });

  it('sends the registration and shows the check-your-email screen', async () => {
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();

    submit();

    await waitFor(() => expect(screen.getByText('checkEmail')).toBeInTheDocument());
    expect(initiateRegistration).toHaveBeenCalledWith({
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Gómez',
      password: VALID_PASSWORD,
      redirectTo: '/owner/onboarding?step=2',
    });
    expect(localStorage.getItem(LS_FIRST_NAME)).toBe('Ana');
    expect(localStorage.getItem(LS_LAST_NAME)).toBe('Gómez');
    expect(localStorage.getItem(LS_EMAIL)).toBe('ana@example.com');
  });

  it('trims whitespace off the submitted values', async () => {
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm({ name: '  Ana  ', lastName: '  Gómez  ', email: '  ana@example.com  ' });

    submit();

    await waitFor(() => expect(initiateRegistration).toHaveBeenCalled());
    expect(jest.mocked(initiateRegistration).mock.calls[0][0]).toMatchObject({
      firstName: 'Ana',
      lastName: 'Gómez',
      email: 'ana@example.com',
    });
  });

  it('wipes wizard state left over from a different account', async () => {
    localStorage.setItem(LS_EMAIL, 'otro@example.com');
    localStorage.setItem(LS_PLAN, 'pro');
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();

    submit();

    await waitFor(() => expect(localStorage.getItem(LS_PLAN)).toBeNull());
  });

  it('keeps wizard state when re-registering the same email, ignoring case', async () => {
    localStorage.setItem(LS_EMAIL, 'ANA@example.com');
    localStorage.setItem(LS_PLAN, 'pro');
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();

    submit();

    await waitFor(() => expect(screen.getByText('checkEmail')).toBeInTheDocument());
    expect(localStorage.getItem(LS_PLAN)).toBe('pro');
  });

  it('keeps wizard state when no previous email was stored', async () => {
    localStorage.setItem(LS_PLAN, 'pro');
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();

    submit();

    await waitFor(() => expect(screen.getByText('checkEmail')).toBeInTheDocument());
    expect(localStorage.getItem(LS_PLAN)).toBe('pro');
  });

  it('surfaces the server error and stays on the form', async () => {
    jest.mocked(initiateRegistration).mockResolvedValue({ success: false, error: 'Email ya registrado' });
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();

    submit();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email ya registrado'));
    expect(screen.queryByText('checkEmail')).not.toBeInTheDocument();
  });

  it('falls back to a generic error message', async () => {
    jest.mocked(initiateRegistration).mockResolvedValue({ success: false });
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();

    submit();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('disables the form while the registration is in flight', async () => {
    let finish: (r: { success: boolean }) => void = () => {};
    jest.mocked(initiateRegistration).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();

    submit();

    await waitFor(() => expect(screen.getByLabelText('name')).toBeDisabled());
    expect(screen.getByText('creating')).toBeInTheDocument();

    finish({ success: true });
    await waitFor(() => expect(screen.getByText('checkEmail')).toBeInTheDocument());
  });

  it('toggles password visibility', () => {
    render(<Step1Personal onNext={jest.fn()} />);
    const password = screen.getByLabelText('password');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('goes back to the form to use a different email', async () => {
    render(<Step1Personal onNext={jest.fn()} />);
    fillForm();
    submit();
    await screen.findByText('checkEmail');

    fireEvent.click(screen.getByRole('button', { name: 'useDifferentEmail' }));

    expect(screen.getByRole('button', { name: 'submitButton' })).toBeInTheDocument();
  });

  it('clears the previous errors once the form is corrected', async () => {
    render(<Step1Personal onNext={jest.fn()} />);

    submit();
    expect(await screen.findByText('firstNameRequired')).toBeInTheDocument();

    fillForm();
    submit();

    await waitFor(() => expect(screen.queryByText('firstNameRequired')).not.toBeInTheDocument());
  });
});
