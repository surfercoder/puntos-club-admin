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

  it('sin el flag la opción privada queda deshabilitada', () => {
    render(<ClubProfileForm organization={organization} privateClubAllowed={false} />);
    expect(screen.getAllByRole('radio')[1]).toBeDisabled();
    expect(screen.getByText('visibility.privateLocked')).toBeTruthy();
  });

  it('un club que ya era privado conserva la opción aunque baje de plan', () => {
    render(
      <ClubProfileForm organization={{ ...organization, is_public: false }} privateClubAllowed={false} />,
    );
    expect(screen.getAllByRole('radio')[1]).not.toBeDisabled();
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
    updateClubProfile.mockResolvedValue({ error: 'db.forbidden' });
    const { container } = render(<ClubProfileForm organization={organization} />);
    submit(container);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('db.forbidden'));
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

  it('marks the public fields with the hint and leaves the private ones alone', () => {
    render(<ClubProfileForm organization={organization} />);

    // Los 7 datos que el beneficiario ve en "Informacion de la empresa": nombre,
    // descripcion, email, telefono, sitio web, rubro y logo. CUIT y razon social no.
    expect(screen.getAllByLabelText('general.publicHint')).toHaveLength(7);

    for (const key of ['general.taxId', 'general.businessName']) {
      const field = screen.getByLabelText(key).closest('div');
      expect(field?.querySelector('[aria-label="general.publicHint"]')).toBeNull();
    }
  });
});

describe('ClubProfileForm — color de marca', () => {
  // jsdom no carga imágenes ni dibuja en canvas: el logo "carga" en un
  // microtask (o falla si la URL dice broken) y el canvas devuelve `pixels`.
  let pixels: number[] = [];
  let context: 'ok' | 'none' | 'throws' = 'ok';

  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin = '';
    set src(url: string) {
      queueMicrotask(() => (url.includes('broken') ? this.onerror?.() : this.onload?.()));
    }
  }

  const red = [215, 20, 26, 255];
  const blue = [20, 40, 200, 255];

  // restoreMocks del jest.config deshace el spy después de cada test.
  beforeEach(() => {
    (global as any).Image = MockImage;
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => {
      if (context === 'none') return null;
      return {
        drawImage: jest.fn(),
        getImageData: () => {
          if (context === 'throws') throw new Error('tainted');
          return { data: new Uint8ClampedArray(pixels) };
        },
      };
    }) as any);
    jest.clearAllMocks();
    updateClubProfile.mockResolvedValue({ error: null });
    pixels = [...red, ...red, ...blue];
    context = 'ok';
  });

  const withLogo = (extra: Partial<Organization> = {}) =>
    ({ ...organization, logo_url: 'https://cdn/one.png', ...extra }) as Organization;

  const savedColor = async (container: HTMLElement) => {
    submit(container);
    await waitFor(() => expect(updateClubProfile).toHaveBeenCalled());
    return updateClubProfile.mock.calls.at(-1)[1].brand_color;
  };

  it('asks for a logo when there is none', () => {
    render(<ClubProfileForm organization={organization} />);
    expect(screen.getByText('noLogo')).toBeInTheDocument();
  });

  it('loads exactly what is saved: no color stays no color', async () => {
    const { container } = render(<ClubProfileForm organization={withLogo()} />);
    await screen.findByRole('radio', { name: /#D7141A/ });
    expect(screen.getByRole('radio', { name: /none/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText('previewHeader')).not.toBeInTheDocument();
    expect(await savedColor(container)).toBeNull();
  });

  it('saves the swatch the owner picks', async () => {
    const { container } = render(<ClubProfileForm organization={withLogo()} />);
    fireEvent.click(await screen.findByRole('radio', { name: /#D7141A/ }));
    expect(await savedColor(container)).toBe('#D7141A');
  });

  it('keeps a saved color that is still in the logo', async () => {
    const { container } = render(<ClubProfileForm organization={withLogo({ brand_color: '#1428C8' })} />);
    await screen.findByRole('radio', { name: /#D7141A/ });
    expect(screen.getByRole('radio', { name: /#1428C8/ })).toHaveAttribute('aria-checked', 'true');
    expect(await savedColor(container)).toBe('#1428C8');
  });

  it('shows a saved color missing from the logo as a selected swatch', async () => {
    const { container } = render(<ClubProfileForm organization={withLogo({ brand_color: '#00FF00' })} />);
    await screen.findByRole('radio', { name: /#D7141A/ });
    expect(screen.getByRole('radio', { name: /#00FF00/ })).toHaveAttribute('aria-checked', 'true');
    expect(await savedColor(container)).toBe('#00FF00');
  });

  it('proposes the dominant color of a logo uploaded in the session and previews it', async () => {
    const { container } = render(<ClubProfileForm organization={withLogo()} />);
    await screen.findByRole('radio', { name: /#D7141A/ });
    pixels = [...blue];
    fireEvent.click(screen.getByTestId('logo'));
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: /#1428C8/ })).toHaveAttribute('aria-checked', 'true'),
    );
    expect(screen.getByText('previewHeader')).toBeInTheDocument();
    expect(await savedColor(container)).toBe('#1428C8');
  });

  it('keeps the chosen color when the new logo still has it', async () => {
    const { container } = render(<ClubProfileForm organization={withLogo({ brand_color: '#1428C8' })} />);
    await screen.findByRole('radio', { name: /#D7141A/ });
    fireEvent.click(screen.getByTestId('logo'));
    await waitFor(() => expect(screen.getByTestId('logo')).toHaveTextContent('https://cdn/logo.png'));
    await act(async () => {});
    expect(await savedColor(container)).toBe('#1428C8');
  });

  it.each([
    ['the logo fails to load', 'https://cdn/broken.png', 'ok'],
    ['the canvas has no 2d context', 'https://cdn/one.png', 'none'],
    ['the canvas is tainted by CORS', 'https://cdn/one.png', 'throws'],
  ] as const)('explains it cannot read the colors when %s', async (_, url, mode) => {
    context = mode;
    const { container } = render(<ClubProfileForm organization={withLogo({ logo_url: url })} />);
    expect(await screen.findByText('noColors')).toBeInTheDocument();
    expect(await savedColor(container)).toBeNull();
  });

  it('keeps the saved color when a new logo has no readable colors', async () => {
    const { container } = render(<ClubProfileForm organization={withLogo({ brand_color: '#1428C8' })} />);
    await screen.findByRole('radio', { name: /#D7141A/ });
    context = 'throws';
    fireEvent.click(screen.getByTestId('logo'));
    await waitFor(() => expect(screen.queryByRole('radio', { name: /#D7141A/ })).not.toBeInTheDocument());
    expect(await savedColor(container)).toBe('#1428C8');
  });

  it('ignores a logo that finishes loading after unmount', async () => {
    const { unmount } = render(<ClubProfileForm organization={withLogo()} />);
    unmount();
    const { unmount: unmountBroken } = render(
      <ClubProfileForm organization={withLogo({ logo_url: 'https://cdn/broken.png' })} />,
    );
    unmountBroken();
    await act(async () => {});
  });

  it('shows the plan lock instead and never sends the color', async () => {
    const { container } = render(
      <ClubProfileForm brandingLocked={<p>locked</p>} organization={withLogo({ brand_color: '#1428C8' })} />,
    );
    expect(screen.getByText('locked')).toBeInTheDocument();
    submit(container);
    await waitFor(() => expect(updateClubProfile).toHaveBeenCalled());
    expect(updateClubProfile.mock.calls[0][1]).not.toHaveProperty('brand_color');
  });
});
