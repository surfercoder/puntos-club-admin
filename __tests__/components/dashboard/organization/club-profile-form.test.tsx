import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { ClubProfileForm } from '@/components/dashboard/organization/club-profile-form';
import type { Organization } from '@/types/organization';

const updateClubProfile = jest.fn();
const refresh = jest.fn();
const toastSuccess = jest.fn();
const toastError = jest.fn();

jest.mock('@/actions/dashboard/organization/actions', () => ({
  updateClubProfile: (...args: unknown[]) => updateClubProfile(...args),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/ui/image-upload', () => ({
  ImageUpload: ({ onChange, value }: any) => (
    <button data-testid="logo" onClick={() => onChange('https://cdn/logo.png')} type="button">
      {value ?? 'none'}
    </button>
  ),
}));
jest.mock('@/components/ui/google-address-autocomplete', () => ({
  GoogleAddressAutocomplete: ({ onPlaceSelected, id }: any) => (
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
        })
      }
    />
  ),
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      type="checkbox"
      {...props}
    />
  ),
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div>
      <span>{value}</span>
      <button data-testid={`set-${value}`} onClick={() => onValueChange('retail')} />
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

const organization = {
  id: '5',
  name: 'One Store',
  creation_date: '2023-08-03',
  plan: 'pro',
  is_public: true,
  logo_url: null,
  invitation_code: 'ONESTORE2024',
} as unknown as Organization;

const submit = (container: HTMLElement) =>
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);

describe('ClubProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateClubProfile.mockResolvedValue({ error: null });
  });

  it('saves every field of the profile', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);

    fireEvent.change(screen.getByLabelText(/general.name/), { target: { value: 'Two Store' } });
    fireEvent.change(screen.getByLabelText(/general.email/), {
      target: { value: 'hola@dos.com' },
    });
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({
          name: 'Two Store',
          contact_email: 'hola@dos.com',
          is_public: true,
          invitation_code: 'ONESTORE2024',
        }),
      ),
    );
    expect(toastSuccess).toHaveBeenCalledWith('saved');
    expect(refresh).toHaveBeenCalled();
  });

  it('turns empty optional fields into nulls', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ description: null, website: null, industry: null }),
      ),
    );
  });

  it('switches the club to private', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ is_public: false }),
      ),
    );
  });

  it('flips the club settings switches', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    fireEvent.click(screen.getByLabelText('settings.allowNewMembers'));
    fireEvent.click(screen.getByLabelText('settings.requiresApproval'));
    fireEvent.click(screen.getByLabelText('settings.emailNotifications'));
    fireEvent.click(screen.getByLabelText('settings.showInExplore'));
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({
          allow_new_members: false,
          requires_approval: true,
          email_notifications: false,
          show_in_explore: false,
        }),
      ),
    );
  });

  it('stores the uploaded logo', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    fireEvent.click(screen.getByTestId('logo'));
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ logo_url: 'https://cdn/logo.png' }),
      ),
    );
  });

  it('clears an emptied invitation code', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    fireEvent.change(screen.getByLabelText('settings.invitationCode'), { target: { value: '  ' } });
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ invitation_code: null }),
      ),
    );
  });

  it('copies the invitation code', async () => {
    jest.useFakeTimers();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ClubProfileForm organization={organization} />);
    fireEvent.click(screen.getByLabelText('copy'));

    await act(async () => { await Promise.resolve(); });
    expect(writeText).toHaveBeenCalledWith('ONESTORE2024');
    act(() => { jest.advanceTimersByTime(1500); });
    jest.useRealTimers();
  });

  it('stays quiet when the clipboard is blocked', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ClubProfileForm organization={organization} />);
    fireEvent.click(screen.getByLabelText('copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
  });

  it('does not try to copy an empty code', () => {
    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ClubProfileForm organization={{ ...organization, invitation_code: null }} />,
    );
    fireEvent.click(screen.getByLabelText('copy'));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('saves the legal data and the address the owner typed', async () => {
    const { container } = render(
      <ClubProfileForm
        address={{
          street: 'Belgrano',
          number: '10',
          city: 'Mendoza',
          state: 'Mendoza',
          zip_code: '5500',
          country: 'Argentina',
          place_id: null,
          latitude: null,
          longitude: null,
        }}
        organization={organization}
      />,
    );

    fireEvent.change(screen.getByLabelText('general.businessName'), {
      target: { value: 'One Store SRL' },
    });
    fireEvent.change(screen.getByLabelText('general.taxId'), { target: { value: '30-1234-9' } });
    fireEvent.change(screen.getByLabelText('address.number'), { target: { value: ' 12 ' } });
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({
          business_name: 'One Store SRL',
          tax_id: '30-1234-9',
          address: expect.objectContaining({ street: 'Belgrano', number: '12', city: 'Mendoza' }),
        }),
      ),
    );
  });

  it('fills the address from a Google suggestion', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    fireEvent.click(screen.getByTestId('pick-place'));
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({
          address: expect.objectContaining({
            street: 'Av. Corrientes',
            number: '1234',
            place_id: 'place-1',
            latitude: null,
          }),
        }),
      ),
    );
  });

  it('skips the address when the club never entered one', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    submit(container);

    await waitFor(() => expect(updateClubProfile).toHaveBeenCalled());
    expect(updateClubProfile.mock.calls[0][1]).not.toHaveProperty('address');
  });

  it('surfaces a save error', async () => {
    updateClubProfile.mockResolvedValue({ error: 'Not authorized' });
    const { container } = render(<ClubProfileForm organization={organization} />);
    submit(container);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Not authorized'));
    expect(refresh).not.toHaveBeenCalled();
  });

  it('falls back to the stored defaults when the club has none set', async () => {
    const { container } = render(
      <ClubProfileForm
        organization={{ ...organization, is_public: undefined, points_label: null, timezone: null } as Organization}
      />,
    );
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({
          is_public: true,
          points_label: 'puntos',
          timezone: 'America/Argentina/Buenos_Aires',
        }),
      ),
    );
  });

  it('lets the owner change the industry, points label and time zone', async () => {
    const { container } = render(<ClubProfileForm organization={organization} />);
    fireEvent.click(screen.getByTestId('set-'));
    fireEvent.click(screen.getByTestId('set-puntos'));
    fireEvent.click(screen.getByTestId('set-America/Argentina/Buenos_Aires'));
    submit(container);

    await waitFor(() =>
      expect(updateClubProfile).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ industry: 'retail', points_label: 'retail', timezone: 'retail' }),
      ),
    );
  });
});
