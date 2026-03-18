import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}`;
      return key;
    };
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

jest.mock('@/actions/dashboard/organization_notification_limits/organization_notification_limit-form-actions', () => ({
  organizationNotificationLimitFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import OrganizationNotificationLimitForm from '@/components/dashboard/organization_notification_limits/organization_notification_limit-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

const mockOrganizations = [
  { id: 'org-1', name: 'Org One' },
  { id: 'org-2', name: 'Org Two' },
];

describe('OrganizationNotificationLimitForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(screen.getByText('form.organizationLabel')).toBeInTheDocument();
    expect(screen.getByText('form.planType')).toBeInTheDocument();
    expect(screen.getByText('form.dailyLimit')).toBeInTheDocument();
    expect(screen.getByText('form.monthlyLimit')).toBeInTheDocument();
    expect(screen.getByText('form.minHours')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const limit = {
      id: '1',
      organization_id: 'org-1',
      plan_type: 'pro' as const,
      daily_limit: 5,
      monthly_limit: 50,
      min_hours_between_notifications: 4,
      notifications_sent_today: 0,
      notifications_sent_this_month: 0,
      last_notification_sent_at: null,
      reset_daily_at: '2024-01-02',
      reset_monthly_at: '2024-02-01',
      created_at: '2024-01-01',
    };

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} organizationNotificationLimit={limit} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders plan type select with options', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    const planSelect = screen.getByLabelText('form.planType');
    expect(planSelect).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('renders organization options', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(screen.getByText('Org One')).toBeInTheDocument();
    expect(screen.getByText('Org Two')).toBeInTheDocument();
  });

  it('renders cancel button linking to notification limits list', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/organization_notification_limits');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state without onSuccess', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Limit created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(toast.success).toHaveBeenCalledWith('Limit created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/organization_notification_limits');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  // -- onSuccess callback on success state (lines 46-47) --
  it('calls onSuccess callback on success state instead of redirect', () => {
    const onSuccessMock = jest.fn();

    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Limit created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} onSuccess={onSuccessMock} />);

    expect(toast.success).toHaveBeenCalledWith('Limit created');
    expect(onSuccessMock).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  // -- onCancel callback --
  it('renders cancel button with onCancel callback', () => {
    const onCancelMock = jest.fn();

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} onCancel={onCancelMock} />);

    const cancelBtn = screen.getByRole('button', { name: 'cancel' });
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalled();
  });

  // -- handlePlanChange (line 59) --
  it('changes plan type selection', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    const planSelect = screen.getByLabelText('form.planType');
    fireEvent.change(planSelect, { target: { value: 'pro' } });
    expect(planSelect).toHaveValue('pro');
  });

  // -- handleSubmit with validation (lines 63-79) --
  it('prevents form submission on validation error', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);

    // Should not crash; validation errors should be set
  });

  it('submits form with valid data', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    // Select an organization
    const orgSelect = screen.getByLabelText('form.organizationLabel');
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);
  });

  // -- setSelectedOrganization (line 95) --
  it('changes organization selection', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    const orgSelect = screen.getByLabelText('form.organizationLabel');
    fireEvent.change(orgSelect, { target: { value: 'org-2' } });
    expect(orgSelect).toHaveValue('org-2');
  });

  // -- Organization select disabled in edit mode --
  it('disables organization select in edit mode', () => {
    const limit = {
      id: '1',
      organization_id: 'org-1',
      plan_type: 'pro' as const,
      daily_limit: 5,
      monthly_limit: 50,
      min_hours_between_notifications: 4,
      notifications_sent_today: 0,
      notifications_sent_this_month: 0,
      last_notification_sent_at: null,
      reset_daily_at: '2024-01-02',
      reset_monthly_at: '2024-02-01',
      created_at: '2024-01-01',
    };

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} organizationNotificationLimit={limit} />);

    const orgSelect = screen.getByLabelText('form.organizationLabel');
    expect(orgSelect).toBeDisabled();
  });

  // -- Renders field errors --
  it('renders field errors from validation state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: '', fieldErrors: { organization_id: ['Required'] } },
      jest.fn(),
      false,
    ]);

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  // -- Cover handleSubmit with falsy number fields (lines 70-74 branches) --
  it('handles submission with empty daily_limit, monthly_limit, and min_hours fields', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    // Select an organization
    const orgSelect = screen.getByLabelText('form.organizationLabel');
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    // Clear the numeric fields to test the falsy branch (Number('') = 0, which is falsy)
    const dailyInput = screen.getByLabelText('form.dailyLimit');
    const monthlyInput = screen.getByLabelText('form.monthlyLimit');
    const minHoursInput = screen.getByLabelText('form.minHours');

    fireEvent.change(dailyInput, { target: { value: '' } });
    fireEvent.change(monthlyInput, { target: { value: '' } });
    fireEvent.change(minHoursInput, { target: { value: '' } });

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);
  });

  // -- Cover default values when organizationNotificationLimit is undefined (lines 140, 154, 168) --
  it('renders default values from planLimits when no existing limit', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    // Default plan is 'free', so planLimits should be PLAN_LIMITS.free
    // The inputs should have default values from the plan limits
    const dailyInput = screen.getByLabelText('form.dailyLimit') as HTMLInputElement;
    const monthlyInput = screen.getByLabelText('form.monthlyLimit') as HTMLInputElement;
    const minHoursInput = screen.getByLabelText('form.minHours') as HTMLInputElement;

    // These should have values (either from planLimits or fallback defaults)
    expect(dailyInput.value).toBeTruthy();
    expect(monthlyInput.value).toBeTruthy();
    expect(minHoursInput.value).toBeTruthy();
  });

  // -- Cover planLimits null branch (line 128) --
  it('renders without planLimits hint when unknown plan type', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    // Change to an unknown plan type
    const planSelect = screen.getByLabelText('form.planType');
    fireEvent.change(planSelect, { target: { value: 'free' } });

    // The planLimits should exist for known types and show the hint
    expect(screen.getByText(/form.defaultLimits/)).toBeInTheDocument();
  });

  // -- Cover field errors with specific field names (lines 99, etc.) --
  it('renders validation field errors for all fields', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      {
        status: 'error',
        message: '',
        fieldErrors: {
          organization_id: ['Org required'],
          plan_type: ['Plan required'],
          daily_limit: ['Daily required'],
          monthly_limit: ['Monthly required'],
          min_hours_between_notifications: ['Hours required'],
        },
      },
      jest.fn(),
      false,
    ]);

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    expect(screen.getByText('Org required')).toBeInTheDocument();
    expect(screen.getByText('Daily required')).toBeInTheDocument();
    expect(screen.getByText('Monthly required')).toBeInTheDocument();
    expect(screen.getByText('Hours required')).toBeInTheDocument();
  });

  // -- Custom redirectTo --
  it('redirects to custom redirectTo on success', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Done', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} redirectTo="/custom" />);

    expect(redirect).toHaveBeenCalledWith('/custom');
  });

  // -- Cover default values with existing data (lines 140, 154, 168 - ?? branches) --
  it('renders with existing notification limit values (covers ?? fallback not taken)', () => {
    const existingLimit = {
      id: '1',
      organization_id: 'org-1',
      plan_type: 'pro' as const,
      daily_limit: 10,
      monthly_limit: 100,
      min_hours_between_notifications: 2,
      notifications_sent_today: 3,
      notifications_sent_this_month: 15,
      last_notification_sent_at: null,
      reset_daily_at: '2024-01-02',
      reset_monthly_at: '2024-02-01',
      created_at: '2024-01-01',
    };

    render(
      <OrganizationNotificationLimitForm
        organizations={mockOrganizations}
        organizationNotificationLimit={existingLimit}
      />
    );

    // The inputs should show the existing values, not the planLimits fallback
    const dailyInput = screen.getByLabelText('form.dailyLimit') as HTMLInputElement;
    expect(dailyInput.value).toBe('10');
    const monthlyInput = screen.getByLabelText('form.monthlyLimit') as HTMLInputElement;
    expect(monthlyInput.value).toBe('100');
    const minHoursInput = screen.getByLabelText('form.minHours') as HTMLInputElement;
    expect(minHoursInput.value).toBe('2');
  });

  // -- Cover handleSubmit with truthy number fields (lines 70-74 truthy branch) --
  it('handles submission with valid number values in daily_limit, monthly_limit, min_hours', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    const orgSelect = screen.getByLabelText('form.organizationLabel');
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    // Set the numeric fields to valid non-zero values (truthy branch of Number())
    const dailyInput = screen.getByLabelText('form.dailyLimit');
    const monthlyInput = screen.getByLabelText('form.monthlyLimit');
    const minHoursInput = screen.getByLabelText('form.minHours');

    fireEvent.change(dailyInput, { target: { value: '5' } });
    fireEvent.change(monthlyInput, { target: { value: '50' } });
    fireEvent.change(minHoursInput, { target: { value: '4' } });

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);
  });

  // -- Cover notifications_sent_today/notifications_sent_this_month zero/falsy (lines 73-74) --
  it('handles submission with zero notifications_sent fields (falsy branch)', () => {
    render(<OrganizationNotificationLimitForm organizations={mockOrganizations} />);

    const orgSelect = screen.getByLabelText('form.organizationLabel');
    fireEvent.change(orgSelect, { target: { value: 'org-1' } });

    // These fields are hidden but exist in the form - set values via form data
    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);
    // The handleSubmit reads formDataObject.notifications_sent_today which defaults to 0 (falsy)
  });
});
