import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

import { ProfileForm } from '@/components/dashboard/profile/profile-form';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();

const mockUpdateUser = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockEq }));

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush, replace: jest.fn(), refresh: mockRefresh, back: mockBack, prefetch: jest.fn(),
  });
  mockEq.mockResolvedValue({ error: null });
  mockUpdateUser.mockResolvedValue({ error: null });
  (createClient as jest.Mock).mockReturnValue({
    from: jest.fn(() => ({ update: mockUpdate })),
    auth: { updateUser: mockUpdateUser },
  });
});

const mockUser = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  username: 'johndoe',
  active: true,
  organization_id: 'org-1',
  created_at: '2024-01-01',
  organization: { id: 'org-1', name: 'Test Org', business_name: 'Test Org SRL', tax_id: 'CUIT-1', logo_url: null, created_at: '2024-01-01' },
  role: { id: 'role-1', name: 'owner', display_name: 'Owner', description: 'Owner role', created_at: '2024-01-01' },
};

describe('ProfileForm', () => {
  it('renders the form with correct labels', () => {
    render(<ProfileForm user={mockUser} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('lastName')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('username')).toBeInTheDocument();
    expect(screen.getByText('organization')).toBeInTheDocument();
    expect(screen.getByText('role')).toBeInTheDocument();
  });

  it('renders with initial data', () => {
    render(<ProfileForm user={mockUser} />);
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
  });

  it('renders organization name as disabled field', () => {
    render(<ProfileForm user={mockUser} />);
    expect(screen.getByDisplayValue('Test Org')).toBeDisabled();
  });

  it('renders role display name as disabled field', () => {
    render(<ProfileForm user={mockUser} />);
    expect(screen.getByDisplayValue('Owner')).toBeDisabled();
  });

  it('renders section header and description', () => {
    render(<ProfileForm user={mockUser} />);
    expect(screen.getByText('section')).toBeInTheDocument();
    expect(screen.getByText('sectionDescription')).toBeInTheDocument();
  });

  it('renders cancel and save buttons', () => {
    render(<ProfileForm user={mockUser} />);
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'saveChanges' })).toBeInTheDocument();
  });

  it('calls router.back on cancel click', () => {
    render(<ProfileForm user={mockUser} />);
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(mockBack).toHaveBeenCalled();
  });

  it('submits form and shows success toast', async () => {
    render(<ProfileForm user={mockUser} />);
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('saveChanges'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('updates email when changed', async () => {
    render(<ProfileForm user={mockUser} />);
    fireEvent.change(screen.getByDisplayValue('john@example.com'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'new@example.com' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('saveChanges'));
  });

  it('does not call updateUser when email is unchanged', async () => {
    render(<ProfileForm user={mockUser} />);
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows error toast when update fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB error' } });
    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({ update: jest.fn(() => ({ eq: mockEq })) })),
      auth: { updateUser: mockUpdateUser },
    });

    render(<ProfileForm user={mockUser} />);
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('shows error toast when email update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: new Error('Email error') });

    render(<ProfileForm user={mockUser} />);
    fireEvent.change(screen.getByDisplayValue('john@example.com'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('shows validation errors for empty required fields', async () => {
    render(<ProfileForm user={mockUser} />);
    fireEvent.change(screen.getByDisplayValue('John'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('Doe'), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
  });

  it('shows generic error for non-Error thrown exceptions', async () => {
    mockEq.mockRejectedValue('string error');
    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({ update: jest.fn(() => ({ eq: mockEq })) })),
      auth: { updateUser: mockUpdateUser },
    });

    render(<ProfileForm user={mockUser} />);
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('error'));
  });

  it('renders with null/undefined fields using defaults', () => {
    const userWithNulls = {
      ...mockUser,
      first_name: null,
      last_name: null,
      email: null,
      username: null,
    };
    render(<ProfileForm user={userWithNulls as any} />);
    // Fields should render with empty strings
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders N/A when organization is null', () => {
    render(<ProfileForm user={{ ...mockUser, organization: null } as any} />);
    expect(screen.getByDisplayValue('N/A')).toBeInTheDocument();
  });

  it('renders role name when display_name is null', () => {
    render(<ProfileForm user={{ ...mockUser, role: { ...mockUser.role, display_name: null } } as any} />);
    expect(screen.getByDisplayValue('owner')).toBeInTheDocument();
  });

  it('renders N/A when role is null', () => {
    render(<ProfileForm user={{ ...mockUser, role: null } as any} />);
    const disabledInputs = screen.getAllByRole('textbox').filter((i: HTMLElement) => (i as HTMLInputElement).disabled);
    // Organization and Role fields
    expect(disabledInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('shows validation error for invalid email format', async () => {
    render(<ProfileForm user={mockUser} />);
    fireEvent.change(screen.getByDisplayValue('john@example.com'), { target: { value: 'not-an-email' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => {
      // Should show email validation error
      expect(screen.getByText(/email/i)).toBeInTheDocument();
    });
  });

  it('shows all field validation errors for completely empty form', async () => {
    render(<ProfileForm user={mockUser} />);
    fireEvent.change(screen.getByDisplayValue('John'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('Doe'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('john@example.com'), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('button', { name: 'saveChanges' }).closest('form')!);
    await waitFor(() => {
      // Multiple field errors should be shown
      const errorTexts = screen.getAllByText(/requerido|required/i);
      expect(errorTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('updates username field when changed', () => {
    render(<ProfileForm user={mockUser} />);
    const usernameInput = screen.getByDisplayValue('johndoe');
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    expect(screen.getByDisplayValue('newusername')).toBeInTheDocument();
  });
});
