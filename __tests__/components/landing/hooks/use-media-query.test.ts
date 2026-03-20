import { renderHook, act } from "@testing-library/react";
import useMediaQuery from "@/components/landing/hooks/use-media-query";

describe("useMediaQuery", () => {
  const createMockMatchMedia = (matches: boolean) => {
    return jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  };

  beforeEach(() => {
    window.matchMedia = createMockMatchMedia(false);
  });

  it("returns false by default when media does not match", () => {
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)"),
    );
    expect(result.current).toBe(false);
  });

  it("returns true when media matches", () => {
    window.matchMedia = createMockMatchMedia(true);
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)"),
    );
    expect(result.current).toBe(true);
  });

  it("registers and cleans up the change listener", () => {
    const addListener = jest.fn();
    const removeListener = jest.fn();
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: addListener,
      removeEventListener: removeListener,
    }));

    const { unmount } = renderHook(() =>
      useMediaQuery("(min-width: 768px)"),
    );
    expect(addListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();
    expect(removeListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("updates when the change listener fires", () => {
    let changeCallback: (() => void) | null = null;
    const mediaObj = {
      matches: false,
      media: "(min-width: 768px)",
      addEventListener: jest.fn((_event: string, cb: () => void) => {
        changeCallback = cb;
      }),
      removeEventListener: jest.fn(),
    };
    window.matchMedia = jest.fn().mockReturnValue(mediaObj);

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)"),
    );
    expect(result.current).toBe(false);

    act(() => {
      mediaObj.matches = true;
      changeCallback!();
    });
    expect(result.current).toBe(true);
  });
});
