"use client";

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function ToastHandler() {
  const toastShownRef = useRef<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const success = url.searchParams.get('success');

    if (success && toastShownRef.current !== success) {
      toastShownRef.current = success;
      toast.success(success);

      url.searchParams.delete('success');
      window.history.replaceState(null, '', url.pathname + url.search);
    }

    if (!success) {
      toastShownRef.current = null;
    }
  }, []);

  return null;
}
