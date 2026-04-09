"use client";

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function ToastHandler() {
  const toastShownRef = useRef<string | null>(null);

  useEffect(() => {
    const showToastFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');

      if (success && toastShownRef.current !== success) {
        toastShownRef.current = success;
        toast.success(success);

        // Remove the success param from URL without triggering a navigation
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        window.history.replaceState(null, '', url.pathname + url.search);
      }

      if (!success) {
        toastShownRef.current = null;
      }
    };

    showToastFromUrl();
    window.addEventListener('popstate', showToastFromUrl);
    return () => window.removeEventListener('popstate', showToastFromUrl);
  }, []);

  return null;
}
