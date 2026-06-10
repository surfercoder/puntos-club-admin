'use client';

import { createContext, use, useEffect, useReducer, useRef } from 'react';

async function loadPlacesLibrary(apiKey: string): Promise<
  | { ok: true; placesLibrary: google.maps.PlacesLibrary; sessionToken: google.maps.places.AutocompleteSessionToken }
  | { ok: false }
> {
  try {
    const { importLibrary, setOptions } = await import('@googlemaps/js-api-loader');
    setOptions({ key: apiKey });
    const lib = (await importLibrary('places')) as google.maps.PlacesLibrary;
    return { ok: true, placesLibrary: lib, sessionToken: new lib.AutocompleteSessionToken() };
  } catch {
    return { ok: false };
  }
}

interface GoogleMapsContextType {
  placesLibrary: google.maps.PlacesLibrary | null;
  sessionToken: google.maps.places.AutocompleteSessionToken | null;
  isLoaded: boolean;
  error: string | null;
}

type MapsState = GoogleMapsContextType;

type MapsAction =
  | {
      type: 'loaded';
      placesLibrary: google.maps.PlacesLibrary;
      sessionToken: google.maps.places.AutocompleteSessionToken;
    }
  | { type: 'error'; error: string };

const initialMapsState: MapsState = {
  placesLibrary: null,
  sessionToken: null,
  isLoaded: false,
  error: null,
};

function mapsReducer(state: MapsState, action: MapsAction): MapsState {
  switch (action.type) {
    case 'loaded':
      return {
        placesLibrary: action.placesLibrary,
        sessionToken: action.sessionToken,
        isLoaded: true,
        error: null,
      };
    case 'error':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

export const useGoogleMaps = (): GoogleMapsContextType => {
  const context = use(GoogleMapsContext);
  if (context === null) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return context;
};

interface GoogleMapsProviderProps {
  apiKey: string;
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ apiKey, children }) => {
  const initialized = useRef(false);
  const [state, dispatch] = useReducer(mapsReducer, initialMapsState);

  useEffect(() => {
    if (!apiKey) {
      dispatch({ type: 'error', error: 'Google Maps API key is not configured' });
      return;
    }
    if (initialized.current) return;
    initialized.current = true;

    let cancelled = false;
    loadPlacesLibrary(apiKey).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        dispatch({
          type: 'loaded',
          placesLibrary: result.placesLibrary,
          sessionToken: result.sessionToken,
        });
      } else {
        dispatch({ type: 'error', error: 'Failed to load Google Maps API' });
        initialized.current = false;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <GoogleMapsContext.Provider value={state}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
