import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { GoogleMapsProvider, useGoogleMaps } from '@/components/providers/google-maps-provider';

// Mock @googlemaps/js-api-loader
const mockSetOptions = jest.fn();
const mockImportLibrary = jest.fn();

jest.mock('@googlemaps/js-api-loader', () => ({
  importLibrary: (...args: unknown[]) => mockImportLibrary(...args),
  setOptions: (...args: unknown[]) => mockSetOptions(...args),
}));

function TestConsumer() {
  const { isLoaded, error, placesLibrary } = useGoogleMaps();
  return (
    <div>
      <span data-testid="loaded">{String(isLoaded)}</span>
      <span data-testid="error">{error ?? 'null'}</span>
      <span data-testid="places">{placesLibrary ? 'loaded' : 'null'}</span>
    </div>
  );
}

describe('GoogleMapsProvider', () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
    mockImportLibrary.mockClear();
  });

  it('shows error when no API key is provided', async () => {
    render(
      <GoogleMapsProvider apiKey="">
        <TestConsumer />
      </GoogleMapsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Google Maps API key is not configured');
    });
    expect(screen.getByTestId('loaded')).toHaveTextContent('false');
  });

  it('loads places library successfully', async () => {
    const mockPlacesLib = {
      AutocompleteSessionToken: jest.fn().mockImplementation(() => ({})),
    };
    mockImportLibrary.mockResolvedValue(mockPlacesLib);

    render(
      <GoogleMapsProvider apiKey="test-api-key">
        <TestConsumer />
      </GoogleMapsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loaded')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(screen.getByTestId('places')).toHaveTextContent('loaded');
    expect(mockSetOptions).toHaveBeenCalledWith({ key: 'test-api-key' });
    expect(mockImportLibrary).toHaveBeenCalledWith('places');
  });

  it('shows error when library fails to load', async () => {
    mockImportLibrary.mockRejectedValue(new Error('Load failed'));

    render(
      <GoogleMapsProvider apiKey="test-api-key">
        <TestConsumer />
      </GoogleMapsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load Google Maps API');
    });
    expect(screen.getByTestId('loaded')).toHaveTextContent('false');
  });

  it('useGoogleMaps throws when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useGoogleMaps());
    }).toThrow('useGoogleMaps must be used within GoogleMapsProvider');

    consoleSpy.mockRestore();
  });

  it('renders children', () => {
    mockImportLibrary.mockResolvedValue({
      AutocompleteSessionToken: jest.fn().mockImplementation(() => ({})),
    });

    render(
      <GoogleMapsProvider apiKey="test-key">
        <div data-testid="child">Child content</div>
      </GoogleMapsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
