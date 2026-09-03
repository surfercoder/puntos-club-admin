'use client';

import { redirect } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import type { ActionState } from '@/lib/error-handler';

interface UseActionStateRedirectParams {
  actionState: ActionState;
  onSuccess?: () => void;
  redirectTo?: string;
}

// Shared "toast on action-state change, then redirect on success" effect,
// repeated across the simpler entity forms.
export function useActionStateRedirect({ actionState, onSuccess, redirectTo }: UseActionStateRedirectParams) {
  const successHandledRef = useRef(false);

  useEffect(() => {
    if (actionState.status === 'success' && !successHandledRef.current) {
      successHandledRef.current = true;
      toast.success(actionState.message);
      onSuccess?.();
    } else if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState, onSuccess]);

  if (actionState.status === 'success' && !onSuccess && redirectTo) {
    redirect(redirectTo);
  }
}
