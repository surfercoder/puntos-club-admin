'use client';

import { useEffect } from 'react';

// Only attempt one reload within this window to avoid an infinite reload loop
// if the error somehow persists across reloads.
const RELOAD_GUARD_KEY = 'pc:stale-action-reload-at';
const RELOAD_GUARD_WINDOW_MS = 10_000;

function isMissingServerActionError(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : '';
  return (
    message.includes('Server Action') &&
    message.includes('was not found on the server')
  );
}

/**
 * Recovers from the "stale deployment" failure mode. When a new build is
 * deployed, the server-action IDs baked into a page that is already open in a
 * user's browser no longer exist on the server. The next form submission throws
 * `UnrecognizedActionError: Server Action "…" was not found on the server`,
 * which surfaces as an unhandled promise rejection — so no React error boundary
 * ever sees it and the user is left with a silently broken page.
 *
 * Reloading pulls the fresh build (with matching action IDs), so we reload once
 * automatically. The timestamped sessionStorage guard prevents a reload loop in
 * the unlikely case the rejection fires again immediately after reload.
 */
export function StaleDeploymentReload() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (!isMissingServerActionError(event.reason)) return;

      // Stop the rejection from bubbling to noisy global handlers; we are
      // recovering from it deliberately.
      event.preventDefault();

      const lastReloadAt = Number(
        sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0
      );
      if (Date.now() - lastReloadAt < RELOAD_GUARD_WINDOW_MS) return;

      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
      window.location.reload();
    };

    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return null;
}
