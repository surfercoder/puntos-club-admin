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
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const { isLoaded, error } = useGoogleMaps();

  // Keep the ref in sync with the latest callback without re-running the setup effect
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    // Capture the node so the cleanup detaches listeners from the same element
    // even if the ref changes before cleanup runs.
    const inputEl = inputRef.current;

    const options: google.maps.places.AutocompleteOptions = {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'place_id', 'geometry'],
    };

    const autocomplete = new google.maps.places.Autocomplete(inputEl, options);

    let lastProcessedPlaceId = '';
    let enterTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let blurTimeoutId: ReturnType<typeof setTimeout> | undefined;

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

      onPlaceSelectedRef.current(addressComponents);
    };

    const placeChangedListener = google.maps.event.addListener(autocomplete, 'place_changed', handlePlaceChanged);

    // Add keyboard listener to detect Enter key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        // Small delay to allow autocomplete to process
        clearTimeout(enterTimeoutId);
        enterTimeoutId = setTimeout(() => {
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
      clearTimeout(blurTimeoutId);
      blurTimeoutId = setTimeout(() => {
        const place = autocomplete.getPlace();
        if (place && place.address_components) {
          handlePlaceChanged();
        }
      }, 300);
    };

    inputEl.addEventListener('keydown', handleKeyDown);
    inputEl.addEventListener('blur', handleBlur);
    document.addEventListener('mousedown', handleDocumentMouseDown);

    autocompleteRef.current = autocomplete;

    return () => {
      clearTimeout(enterTimeoutId);
      clearTimeout(blurTimeoutId);
      placeChangedListener.remove();
      inputEl.removeEventListener('keydown', handleKeyDown);
      inputEl.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isLoaded]);

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
