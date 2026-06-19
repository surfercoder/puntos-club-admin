import { render } from '@testing-library/react';
import { StaleDeploymentReload } from '@/components/providers/stale-deployment-reload';

// Mirrors the private constant in the component under test.
const RELOAD_GUARD_KEY = 'pc:stale-action-reload-at';

function dispatchRejection(reason: unknown) {
  const event = new Event('unhandledrejection') as PromiseRejectionEvent;
  Object.defineProperty(event, 'reason', { value: reason, configurable: true });
  const preventDefault = jest.fn();
  Object.defineProperty(event, 'preventDefault', {
    value: preventDefault,
    configurable: true,
  });
  window.dispatchEvent(event);
  return preventDefault;
}

describe('StaleDeploymentReload', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // window.location.reload() is a no-op in jsdom, so we observe recovery
    // through the sessionStorage guard rather than the reload itself.
  });

  it('recovers from a stale server-action rejection (Error reason)', () => {
    render(<StaleDeploymentReload />);

    const preventDefault = dispatchRejection(
      new Error('Server Action "abc123" was not found on the server.')
    );

    expect(preventDefault).toHaveBeenCalled();
    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).not.toBeNull();
  });

  it('matches string rejection reasons too', () => {
    render(<StaleDeploymentReload />);

    dispatchRejection('Server Action "abc123" was not found on the server.');

    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).not.toBeNull();
  });

  it('ignores unrelated rejections', () => {
    render(<StaleDeploymentReload />);

    const preventDefault = dispatchRejection(new Error('Some other error'));

    expect(preventDefault).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBeNull();
  });

  it('ignores non-error, non-string rejection reasons', () => {
    render(<StaleDeploymentReload />);

    dispatchRejection({ unexpected: true });

    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBeNull();
  });

  it('does not re-trigger within the guard window', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(1_000);
      render(<StaleDeploymentReload />);

      dispatchRejection(
        new Error('Server Action "abc" was not found on the server.')
      );
      const firstStamp = sessionStorage.getItem(RELOAD_GUARD_KEY);

      // 1s later — still inside the 10s guard window.
      jest.setSystemTime(2_000);
      dispatchRejection(
        new Error('Server Action "def" was not found on the server.')
      );

      // Guard stamp is untouched, proving the second attempt was skipped.
      expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBe(firstStamp);
    } finally {
      jest.useRealTimers();
    }
  });

  it('re-triggers again after the guard window elapses', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(1_000);
      render(<StaleDeploymentReload />);

      dispatchRejection(
        new Error('Server Action "abc" was not found on the server.')
      );
      const firstStamp = sessionStorage.getItem(RELOAD_GUARD_KEY);

      // 11s later — outside the 10s guard window.
      jest.setSystemTime(12_000);
      dispatchRejection(
        new Error('Server Action "def" was not found on the server.')
      );

      expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).not.toBe(firstStamp);
    } finally {
      jest.useRealTimers();
    }
  });

  it('removes its listener on unmount', () => {
    const { unmount } = render(<StaleDeploymentReload />);
    unmount();

    const preventDefault = dispatchRejection(
      new Error('Server Action "abc123" was not found on the server.')
    );

    expect(preventDefault).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBeNull();
  });
});
