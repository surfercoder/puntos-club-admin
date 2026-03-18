import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  let listeners: Record<string, (() => void)[]>;

  const createMatchMedia = (matches: boolean) => {
    listeners = {};
    return jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn((event: string, handler: () => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      }),
      removeEventListener: jest.fn((event: string, handler: () => void) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((h) => h !== handler);
        }
      }),
    }));
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false as initial state (undefined coerced via !!)', () => {
    // Before effect runs, isMobile is undefined, !!undefined === false
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    // After effect runs it will also be false for desktop width
    expect(result.current).toBe(false);
  });

  it('returns false for desktop width (>= 768)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true for mobile width (< 768)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('responds to media query change events', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
      listeners['change']?.forEach((handler) => handler());
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    const mockMatchMedia = createMatchMedia(false);
    window.matchMedia = mockMatchMedia;

    const { unmount } = renderHook(() => useIsMobile());
    const mqlInstance = mockMatchMedia.mock.results[0].value;

    unmount();
    expect(mqlInstance.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('returns true at exact boundary (width = 767)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 767, writable: true, configurable: true });
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false at exact boundary (width = 768)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
