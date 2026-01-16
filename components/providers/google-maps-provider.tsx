'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

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

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ apiKey, children }) => {
  const initialized = useRef(false);
  const [placesLibrary, setPlacesLibrary] = useState<google.maps.PlacesLibrary | null>(null);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is not configured');
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
        setPlacesLibrary(placesLib);
        setSessionToken(new placesLib.AutocompleteSessionToken());
        setIsLoaded(true);
        setError(null);
      })
      .catch((err: Error) => {
        console.error('Error loading Google Maps API:', err);
        setError('Failed to load Google Maps API');
        initialized.current = false;
      });
  }, [apiKey]);

  return (
    <GoogleMapsContext.Provider value={{ placesLibrary, sessionToken, isLoaded, error }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
