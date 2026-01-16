'use client';

import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useGoogleMaps } from '@/components/providers/google-maps-provider';

export interface GoogleAddressComponents {
  street: string;
  number: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  formatted_address: string;
  place_id: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleAddressAutocompleteProps {
  onPlaceSelected: (address: GoogleAddressComponents) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export function GoogleAddressAutocomplete({
  onPlaceSelected,
  defaultValue = '',
  placeholder = 'Start typing an address...',
  className,
  id,
  name,
  disabled,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, error } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    const options: google.maps.places.AutocompleteOptions = {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'place_id', 'geometry'],
    };

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, options);

    let lastProcessedPlaceId = '';

    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();

      if (!place.address_components) {
        return;
      }

      // Prevent duplicate processing
      if (place.place_id === lastProcessedPlaceId) {
        return;
      }
      lastProcessedPlaceId = place.place_id || '';

      const addressComponents: GoogleAddressComponents = {
        street: '',
        number: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        formatted_address: place.formatted_address || '',
        place_id: place.place_id || '',
        latitude: place.geometry?.location?.lat(),
        longitude: place.geometry?.location?.lng(),
      };

      for (const component of place.address_components) {
        const componentType = component.types[0];

        switch (componentType) {
          case 'street_number':
            addressComponents.number = component.long_name;
            break;
          case 'route':
            addressComponents.street = component.long_name;
            break;
          case 'locality':
            addressComponents.city = component.long_name;
            break;
          case 'administrative_area_level_2':
            // Fallback for city when locality is not available (e.g., Argentina)
            if (!addressComponents.city) {
              addressComponents.city = component.long_name;
            }
            break;
          case 'administrative_area_level_1':
            addressComponents.state = component.long_name;
            break;
          case 'country':
            addressComponents.country = component.long_name;
            break;
          case 'postal_code':
            addressComponents.zip_code = component.long_name;
            break;
        }
      }

      onPlaceSelected(addressComponents);
    };

    google.maps.event.addListener(autocomplete, 'place_changed', handlePlaceChanged);

    // Add keyboard listener to detect Enter key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        // Small delay to allow autocomplete to process
        setTimeout(() => {
          const place = autocomplete.getPlace();
          if (place && place.address_components) {
            handlePlaceChanged();
          }
        }, 100);
      }
    };

    // Detect mousedown on autocomplete dropdown items
    const handleDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicking on a pac-item (Google's autocomplete suggestion class)
      if (target.closest('.pac-item') || target.closest('.pac-container')) {
        // User is selecting from dropdown
      }
    };

    // Add blur listener to detect when user clicks on a suggestion
    const handleBlur = () => {
      // Longer delay to allow autocomplete to process the click
      setTimeout(() => {
        const place = autocomplete.getPlace();
        if (place && place.address_components) {
          handlePlaceChanged();
        }
      }, 300);
    };

    inputRef.current.addEventListener('keydown', handleKeyDown);
    inputRef.current.addEventListener('blur', handleBlur);
    document.addEventListener('mousedown', handleDocumentMouseDown);

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      if (inputRef.current) {
        inputRef.current.removeEventListener('keydown', handleKeyDown);
        inputRef.current.removeEventListener('blur', handleBlur);
      }
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isLoaded, onPlaceSelected]);

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <Input
      ref={inputRef}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      id={id}
      name={name}
      disabled={disabled || !isLoaded}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      autoComplete="off"
    />
  );
}
