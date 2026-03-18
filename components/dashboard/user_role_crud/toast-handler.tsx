"use client";

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toastShownRef = useRef<string | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    if (success && toastShownRef.current !== success) {
      toastShownRef.current = success;
      toast.success(success);
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      router.replace(url.pathname + url.search, { scroll: false });
    }
    if (!success) {
      toastShownRef.current = null;
    }
  }, [searchParams, router]);

  return null;
}
