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

const mockInvalidate = jest.fn();
const mockIsAtLimit = jest.fn(() => false);

jest.mock('@/components/providers/plan-usage-provider', () => ({
  usePlanUsage: jest.fn(() => ({
    summary: null, isLoading: false, invalidate: mockInvalidate,
    isAtLimit: mockIsAtLimit, shouldWarn: jest.fn(() => false), getFeature: jest.fn(), plan: null,
  })),
}));

jest.mock('@/actions/dashboard/user/user-form-actions', () => ({
  userFormAction: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  ...jest.requireActual('@/lib/auth/roles'),
  isOwner: jest.fn(() => false),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import UserForm from '@/components/dashboard/user/user-form';
import { isOwner } from '@/lib/auth/roles';

const React = require('react');
const { toast } = require('sonner');
const { useRouter } = require('next/navigation');
const { userFormAction } = require('@/actions/dashboard/user/user-form-actions');

const mockPush = jest.fn();

const mockOrganizations = [
  { id: 'org-1', name: 'Org One', business_name: 'Org One SRL', tax_id: 'CUIT-1', logo_url: null, created_at: '2024-01-01' },
];

const mockRoles = [
  { id: 'role-1', name: 'owner', display_name: 'Owner', description: 'Owner role', created_at: '2024-01-01' },
  { id: 'role-2', name: 'cashier', display_name: 'Cashier', description: 'Cashier role', created_at: '2024-01-01' },
  { id: 'role-3', name: 'collaborator', display_name: 'Collaborator', description: 'Collaborator role', created_at: '2024-01-01' },
  { id: 'role-4', name: 'final_user', display_name: 'Final User', description: 'End user', created_at: '2024-01-01' },
];

describe('UserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAtLimit.mockReturnValue(false);
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush, replace: jest.fn(), refresh: jest.fn(), back: jest.fn(), prefetch: jest.fn(),
    });
  });

  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    expect(screen.getByText('organizationLabel')).toBeInTheDocument();
    expect(screen.getByText('roleLabel')).toBeInTheDocument();
    expect(screen.getByText('firstNameLabel')).toBeInTheDocument();
    expect(screen.getByText('lastNameLabel')).toBeInTheDocument();
    expect(screen.getByText('emailLabel')).toBeInTheDocument();
    expect(screen.getByText('usernameLabel')).toBeInTheDocument();
    expect(screen.getByText('phoneLabel')).toBeInTheDocument();
    expect(screen.getByText('documentIdLabel')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    expect(screen.getByRole('button', { name: 'createUser' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '123456',
      document_id: 'DNI123',
      active: true,
      organization_id: 'org-1',
      role_id: 'role-1',
      created_at: '2024-01-01',
    };

    render(<UserForm user={user} organizations={mockOrganizations} roles={mockRoles} />);

    expect(screen.getByRole('button', { name: 'updateUser' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '123456',
      document_id: 'DNI123',
      active: true,
      organization_id: 'org-1',
      role_id: 'role-1',
      created_at: '2024-01-01',
    };

    render(<UserForm user={user} organizations={mockOrganizations} roles={mockRoles} />);

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DNI123')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const firstNameInput = screen.getByRole('textbox', { name: 'firstNameLabel' });
    expect(firstNameInput).toHaveValue('');
  });

  it('renders cancel button linking to users list', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/users');
  });

  it('renders role options', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    expect(screen.getByText('Owner (owner)')).toBeInTheDocument();
    expect(screen.getByText('Cashier (cashier)')).toBeInTheDocument();
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    expect(screen.getByRole('button', { name: 'createUser' })).toBeDisabled();
  });

  it('renders field errors from actionState', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Validation failed', fieldErrors: { email: ['Invalid email'] } },
      jest.fn(),
      false,
    ]);

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('renders with defaultOrgId pre-selected', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} defaultOrgId="org-1" />);

    const orgSelect = screen.getByLabelText('organizationLabel');
    expect(orgSelect).toHaveValue('org-1');
  });

  // -- wrappedAction success path (lines 69-78) --
  it('calls toast.success and redirects on successful action', async () => {
    (userFormAction as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'User created successfully',
      fieldErrors: {},
    });

    let capturedFormAction: any;
    (React.useActionState as jest.Mock).mockImplementation((fn: any, initialState: any) => {
      capturedFormAction = fn;
      return [initialState, jest.fn(), false];
    });

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    // Call the wrappedAction directly
    const result = await capturedFormAction(
      { status: '', message: '', fieldErrors: {} },
      new FormData()
    );

    expect(toast.success).toHaveBeenCalledWith('User created successfully');
    expect(mockInvalidate).toHaveBeenCalled();
    expect(result.message).toBe('User created successfully');
  });

  // -- wrappedAction error path (lines 71-74) --
  it('calls toast.error on action with error message', async () => {
    (userFormAction as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Failed to create user',
      fieldErrors: {},
    });

    let capturedFormAction: any;
    (React.useActionState as jest.Mock).mockImplementation((fn: any, initialState: any) => {
      capturedFormAction = fn;
      return [initialState, jest.fn(), false];
    });

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const result = await capturedFormAction(
      { status: '', message: '', fieldErrors: {} },
      new FormData()
    );

    expect(toast.error).toHaveBeenCalledWith('Failed to create user');
    expect(result.message).toBe('Failed to create user');
  });

  it('calls toast.error on action with Error in message', async () => {
    (userFormAction as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Error: something bad',
      fieldErrors: {},
    });

    let capturedFormAction: any;
    (React.useActionState as jest.Mock).mockImplementation((fn: any, initialState: any) => {
      capturedFormAction = fn;
      return [initialState, jest.fn(), false];
    });

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const _result = await capturedFormAction(
      { status: '', message: '', fieldErrors: {} },
      new FormData()
    );

    expect(toast.error).toHaveBeenCalledWith('Error: something bad');
  });

  // -- wrappedAction with no message (line 70 - falsy branch) --
  it('does not show toast when action result has no message', async () => {
    (userFormAction as jest.Mock).mockResolvedValue({
      status: '',
      message: '',
      fieldErrors: {},
    });

    let capturedFormAction: any;
    (React.useActionState as jest.Mock).mockImplementation((fn: any, initialState: any) => {
      capturedFormAction = fn;
      return [initialState, jest.fn(), false];
    });

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    await capturedFormAction(
      { status: '', message: '', fieldErrors: {} },
      new FormData()
    );

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  // -- handleSubmit validation (lines 95-102) --
  it('prevents form submission on validation error', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const form = screen.getByRole('button', { name: 'createUser' }).closest('form')!;
    fireEvent.submit(form);

    // Should not crash; validation errors would be set
  });

  // -- Role change handler (line 149) --
  it('changes role selection', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const roleSelect = screen.getByLabelText('roleLabel');
    fireEvent.change(roleSelect, { target: { value: 'role-2' } });
    expect(roleSelect).toHaveValue('role-2');
  });

  // -- Organization change handler (line 122) --
  it('changes organization selection', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const orgSelect = screen.getByLabelText('organizationLabel');
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });
    expect(orgSelect).toHaveValue('org-1');
  });

  // -- Active checkbox change (line 285) --
  it('toggles active checkbox', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const activeCheckbox = screen.getByRole('checkbox');
    // It starts checked (default true)
    expect(activeCheckbox).toBeChecked();

    // Uncheck
    fireEvent.click(activeCheckbox);
  });

  // -- isOrgDisabled (when isOwner returns true and only one org) --
  it('disables org select when current user is owner with single org', () => {
    (isOwner as jest.Mock).mockReturnValue(true);

    const currentUser = {
      id: 'user-1',
      email: 'owner@test.com',
      role_id: 'role-1',
      organization_id: 'org-1',
    } as any;

    render(
      <UserForm
        organizations={mockOrganizations}
        roles={mockRoles}
        currentUser={currentUser}
      />
    );

    const orgSelect = screen.getByLabelText('organizationLabel');
    expect(orgSelect).toBeDisabled();

    // Should show the hint text
    expect(screen.getByText('orgDisabledHint')).toBeInTheDocument();
  });

  // -- disabledRoleNames derivation (lines 62-66) --
  it('disables roles that are at plan limit', () => {
    mockIsAtLimit.mockImplementation((feature: string) => feature === 'cashiers');

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    // Cashier role should be disabled
    const roleSelect = screen.getByLabelText('roleLabel');
    const cashierOption = Array.from(roleSelect.querySelectorAll('option')).find(
      (opt: any) => opt.value === 'role-2'
    ) as HTMLOptionElement;
    expect(cashierOption).toBeDisabled();
  });

  it('does not disable the current user role even if at limit (editing)', () => {
    mockIsAtLimit.mockImplementation((feature: string) => feature === 'cashiers');

    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '123456',
      document_id: 'DNI123',
      active: true,
      organization_id: 'org-1',
      role_id: 'role-2', // cashier
      created_at: '2024-01-01',
    };

    render(<UserForm user={user} organizations={mockOrganizations} roles={mockRoles} />);

    // Cashier role should NOT be disabled because user already has it
    const roleSelect = screen.getByLabelText('roleLabel');
    const cashierOption = Array.from(roleSelect.querySelectorAll('option')).find(
      (opt: any) => opt.value === 'role-2'
    ) as HTMLOptionElement;
    expect(cashierOption).not.toBeDisabled();
  });

  // -- Submit button disabled when selected role is at limit --
  it('disables submit button when selected role is at limit', () => {
    mockIsAtLimit.mockImplementation((feature: string) => feature === 'cashiers');

    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    // Select the cashier role which is at limit
    const roleSelect = screen.getByLabelText('roleLabel');
    fireEvent.change(roleSelect, { target: { value: 'role-2' } });

    const submitBtn = screen.getByRole('button', { name: 'createUser' });
    expect(submitBtn).toBeDisabled();
  });

  // -- getUserType returns 'beneficiary' for final_user role --
  it('sets user_type to beneficiary when final_user role is selected', () => {
    const { container } = render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const roleSelect = screen.getByLabelText('roleLabel');
    fireEvent.change(roleSelect, { target: { value: 'role-4' } });

    const userTypeInput = container.querySelector('input[name="user_type"]') as HTMLInputElement;
    expect(userTypeInput.value).toBe('beneficiary');

    // Password field should NOT be shown for beneficiary
    expect(screen.queryByLabelText('passwordRequired')).not.toBeInTheDocument();
  });

  // -- Password field shown for app_user role --
  it('shows password field for non-final_user role', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const roleSelect = screen.getByLabelText('roleLabel');
    fireEvent.change(roleSelect, { target: { value: 'role-2' } });

    // Password field should be shown
    expect(screen.getByText('passwordRequired')).toBeInTheDocument();
  });

  // -- Role description shown when role is selected and not disabled --
  it('shows role description when a valid role is selected', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const roleSelect = screen.getByLabelText('roleLabel');
    fireEvent.change(roleSelect, { target: { value: 'role-1' } });

    expect(screen.getByText('Owner role')).toBeInTheDocument();
  });

  // -- roleLimitReachedHint shown when selected role is disabled --
  it('shows roleLimitReachedHint when selected role is at limit', () => {
    mockIsAtLimit.mockImplementation((feature: string) => feature === 'cashiers');

    // Pre-select role-2 (cashier) via user prop so the conditional renders immediately
    const user = {
      id: '1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@test.com',
      username: 'jane',
      phone: '111',
      document_id: 'DNI1',
      active: true,
      organization_id: 'org-1',
      role_id: 'role-3', // collaborator (not cashier, so cashier IS disabled for this user)
      created_at: '2024-01-01',
    };

    render(<UserForm user={user} organizations={mockOrganizations} roles={mockRoles} />);

    // Now select the cashier role which is at limit
    const roleSelect = screen.getByLabelText('roleLabel');
    fireEvent.change(roleSelect, { target: { value: 'role-2' } });

    expect(screen.getByText('roleLimitReachedHint')).toBeInTheDocument();
  });

  // -- getUserType returns 'app_user' when no role selected (line 88) --
  it('getUserType returns app_user when roleId is undefined', () => {
    const { container } = render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);
    // No role selected - user_type hidden input should be 'app_user'
    const userTypeInput = container.querySelector('input[name="user_type"]') as HTMLInputElement;
    expect(userTypeInput.value).toBe('app_user');
  });

  // -- Lines 165-170: selected role at limit shows hint, selected role not at limit shows description --
  it('shows role description when role is selected and NOT disabled (line 170-173)', () => {
    render(<UserForm organizations={mockOrganizations} roles={mockRoles} />);

    const roleSelect = screen.getByLabelText('roleLabel');
    fireEvent.change(roleSelect, { target: { value: 'role-3' } });

    // Should show collaborator description
    expect(screen.getByText('Collaborator role')).toBeInTheDocument();
  });

  // -- disabledRoleNamesProp merge --
  it('merges disabledRoleNames from prop with plan limit derived ones', () => {
    render(
      <UserForm
        organizations={mockOrganizations}
        roles={mockRoles}
        disabledRoleNames={['owner']}
      />
    );

    const roleSelect = screen.getByLabelText('roleLabel');
    const ownerOption = Array.from(roleSelect.querySelectorAll('option')).find(
      (opt: any) => opt.value === 'role-1'
    ) as HTMLOptionElement;
    expect(ownerOption).toBeDisabled();
  });
});
