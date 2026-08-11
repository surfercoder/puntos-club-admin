jest.mock('@/components/providers/google-maps-provider', () => ({ useGoogleMaps: jest.fn() }));

import { fireEvent, render, screen, act } from '@testing-library/react';

import { useGoogleMaps } from '@/components/providers/google-maps-provider';
import {
  GoogleAddressAutocomplete,
  type GoogleAddressComponents,
} from '@/components/ui/google-address-autocomplete';

type Component = { long_name: string; types: string[] };

const component = (type: string, long_name: string): Component => ({ long_name, types: [type] });

/** The place the fake Autocomplete widget will hand back on the next getPlace(). */
let currentPlace: Record<string, unknown> | undefined;
let placeChangedHandler: () => void;
const clearInstanceListeners = jest.fn();
const removeListener = jest.fn();
const autocompleteCtor = jest.fn();

const installGoogleMaps = () => {
  autocompleteCtor.mockImplementation(function Autocomplete(this: Record<string, unknown>) {
    this.getPlace = () => currentPlace;
  });
  (globalThis as unknown as { google: unknown }).google = {
    maps: {
      places: { Autocomplete: autocompleteCtor },
      event: {
        addListener: jest.fn((_instance: unknown, _event: string, handler: () => void) => {
          placeChangedHandler = handler;
          return { remove: removeListener };
        }),
        clearInstanceListeners,
      },
    },
  };
};

const mapsState = (state: { isLoaded?: boolean; error?: string | null }) =>
  (useGoogleMaps as jest.Mock).mockReturnValue({ isLoaded: true, error: null, ...state });

const renderAutocomplete = (onPlaceSelected = jest.fn()) => {
  const utils = render(<GoogleAddressAutocomplete onPlaceSelected={onPlaceSelected} />);
  return { ...utils, onPlaceSelected };
};

describe('GoogleAddressAutocomplete', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    installGoogleMaps();
    mapsState({});
    currentPlace = undefined;
    autocompleteCtor.mockClear();
    clearInstanceListeners.mockClear();
    removeListener.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the provider error instead of an input when Maps failed to load', () => {
    mapsState({ error: 'Failed to load Google Maps API' });
    renderAutocomplete();

    expect(screen.getByText('Failed to load Google Maps API')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('keeps the input disabled until the library is loaded', () => {
    mapsState({ isLoaded: false });
    renderAutocomplete();

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(autocompleteCtor).not.toHaveBeenCalled();
  });

  it('stays disabled when the caller disables it even after loading', () => {
    render(<GoogleAddressAutocomplete disabled onPlaceSelected={jest.fn()} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('forwards the presentational and a11y props to the input', () => {
    render(
      <GoogleAddressAutocomplete
        aria-describedby="hint"
        aria-invalid
        className="custom"
        defaultValue="Av. Corrientes 1234"
        id="address"
        name="address"
        placeholder="Escribí una dirección"
        onPlaceSelected={jest.fn()}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Av. Corrientes 1234');
    expect(input).toHaveAttribute('placeholder', 'Escribí una dirección');
    expect(input).toHaveAttribute('id', 'address');
    expect(input).toHaveAttribute('name', 'address');
    expect(input).toHaveAttribute('aria-describedby', 'hint');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('custom');
  });

  it('maps every address component Google returns onto the callback shape', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = {
      place_id: 'place-1',
      formatted_address: 'Av. Corrientes 1234, CABA',
      geometry: { location: { lat: () => -34.6, lng: () => -58.4 } },
      address_components: [
        component('street_number', '1234'),
        component('route', 'Av. Corrientes'),
        component('locality', 'Buenos Aires'),
        component('administrative_area_level_1', 'CABA'),
        component('country', 'Argentina'),
        component('postal_code', 'C1043'),
        component('sublocality', 'ignorado'),
      ],
    };
    act(() => placeChangedHandler());

    expect(onPlaceSelected).toHaveBeenCalledWith<[GoogleAddressComponents]>({
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
    });
  });

  it('falls back to administrative_area_level_2 for the city when there is no locality', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = {
      place_id: 'place-2',
      address_components: [component('administrative_area_level_2', 'Partido de La Plata')],
    };
    act(() => placeChangedHandler());

    expect(onPlaceSelected).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Partido de La Plata' }),
    );
  });

  it('keeps the locality when administrative_area_level_2 also arrives', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = {
      place_id: 'place-3',
      address_components: [
        component('locality', 'La Plata'),
        component('administrative_area_level_2', 'Partido de La Plata'),
      ],
    };
    act(() => placeChangedHandler());

    expect(onPlaceSelected).toHaveBeenCalledWith(expect.objectContaining({ city: 'La Plata' }));
  });

  it('defaults the optional fields when Google omits them', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = { address_components: [component('route', 'Av. Corrientes')] };
    act(() => placeChangedHandler());

    expect(onPlaceSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        formatted_address: '',
        place_id: '',
        latitude: undefined,
        longitude: undefined,
      }),
    );
  });

  it('ignores a place with no address components', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = { place_id: 'place-1' };
    act(() => placeChangedHandler());

    expect(onPlaceSelected).not.toHaveBeenCalled();
  });

  it('reports the same place only once', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = { place_id: 'place-1', address_components: [component('route', 'Av. Corrientes')] };
    act(() => placeChangedHandler());
    act(() => placeChangedHandler());

    expect(onPlaceSelected).toHaveBeenCalledTimes(1);
  });

  it('resolves the pending place on Enter without submitting the form', () => {
    const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    const onPlaceSelected = jest.fn();
    render(
      <form onSubmit={onSubmit}>
        <GoogleAddressAutocomplete onPlaceSelected={onPlaceSelected} />
      </form>,
    );

    currentPlace = { place_id: 'place-1', address_components: [component('route', 'Av. Corrientes')] };
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    act(() => jest.advanceTimersByTime(100));

    expect(onPlaceSelected).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does nothing on Enter while no place is resolved yet', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = undefined;
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    act(() => jest.advanceTimersByTime(100));

    expect(onPlaceSelected).not.toHaveBeenCalled();
  });

  it('ignores keys other than Enter', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = { place_id: 'place-1', address_components: [component('route', 'X')] };
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'a' });
    act(() => jest.advanceTimersByTime(500));

    expect(onPlaceSelected).not.toHaveBeenCalled();
  });

  it('resolves the pending place shortly after blur', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = { place_id: 'place-1', address_components: [component('route', 'Av. Corrientes')] };
    fireEvent.blur(screen.getByRole('textbox'));
    act(() => jest.advanceTimersByTime(300));

    expect(onPlaceSelected).toHaveBeenCalledTimes(1);
  });

  it('does nothing on blur while no place is resolved yet', () => {
    const { onPlaceSelected } = renderAutocomplete();

    currentPlace = undefined;
    fireEvent.blur(screen.getByRole('textbox'));
    act(() => jest.advanceTimersByTime(300));

    expect(onPlaceSelected).not.toHaveBeenCalled();
  });

  it('disposes the widget on unmount so a remount rebuilds it', () => {
    const { unmount } = renderAutocomplete();
    expect(autocompleteCtor).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeListener).toHaveBeenCalled();
    expect(clearInstanceListeners).toHaveBeenCalled();
  });

  it('builds the widget once across re-renders', () => {
    const { rerender } = render(<GoogleAddressAutocomplete onPlaceSelected={jest.fn()} />);
    rerender(<GoogleAddressAutocomplete onPlaceSelected={jest.fn()} />);

    expect(autocompleteCtor).toHaveBeenCalledTimes(1);
  });

  it('always calls the latest callback without rebuilding the widget', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<GoogleAddressAutocomplete onPlaceSelected={first} />);
    rerender(<GoogleAddressAutocomplete onPlaceSelected={second} />);

    currentPlace = { place_id: 'place-1', address_components: [component('route', 'X')] };
    act(() => placeChangedHandler());

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
