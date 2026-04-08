'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { createContext, useContext, useEffect, useReducer, useRef } from 'react';

interface GoogleMapsContextType {
  placesLibrary: google.maps.PlacesLibrary | null;
  sessionToken: google.maps.places.AutocompleteSessionToken | null;
  isLoaded: boolean;
  error: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

export const useGoogleMaps = (): GoogleMapsContextType => {
  const context = useContext(GoogleMapsContext);
  if (context === null) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return context;
};

interface GoogleMapsProviderProps {
  apiKey: string;
  children: React.ReactNode;
}

type MapsState = {
  placesLibrary: google.maps.PlacesLibrary | null;
  sessionToken: google.maps.places.AutocompleteSessionToken | null;
  isLoaded: boolean;
  error: string | null;
};

type MapsAction =
  | { type: 'loaded'; placesLibrary: google.maps.PlacesLibrary; sessionToken: google.maps.places.AutocompleteSessionToken }
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

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ apiKey, children }) => {
  const initialized = useRef(false);
  const [state, dispatch] = useReducer(mapsReducer, initialMapsState);

  useEffect(() => {
    if (!apiKey) {
      dispatch({ type: 'error', error: 'Google Maps API key is not configured' });
      return;
    }

    if (initialized.current) {
      return;
    }

    initialized.current = true;
    setOptions({ key: apiKey });

    importLibrary('places')
      .then((lib) => {
        const placesLib = lib as google.maps.PlacesLibrary;
        dispatch({
          type: 'loaded',
          placesLibrary: placesLib,
          sessionToken: new placesLib.AutocompleteSessionToken(),
        });
      })
      .catch((_err: Error) => {
        dispatch({ type: 'error', error: 'Failed to load Google Maps API' });
        initialized.current = false;
      });
  }, [apiKey]);

  return (
    <GoogleMapsContext.Provider value={state}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
