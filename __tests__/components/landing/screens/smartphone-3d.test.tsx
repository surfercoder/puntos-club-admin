import React from "react";
import { render, screen } from "@testing-library/react";
import Smartphone3D from "@/components/landing/screens/smartphone-3d";

/* ── shared mocks ── */
jest.mock("gsap", () => ({
  __esModule: true,
  default: {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      kill: jest.fn(),
      pause: jest.fn(),
      play: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    effects: {},
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  },
}));
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
  ScrollTrigger: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
}));
jest.mock("gsap/TextPlugin", () => ({
  __esModule: true,
  default: {},
  TextPlugin: {},
}));

/* ── Three.js mocks ── */
jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn(),
  useLoader: jest.fn(() => ({})),
  useThree: jest.fn(() => ({ gl: {}, camera: {} })),
}));

jest.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  Environment: () => null,
  useGLTF: jest.fn(() => ({
    scene: {
      rotation: { y: 0 },
      traverse: jest.fn(),
    },
    nodes: {},
    materials: {},
  })),
  useTexture: jest.fn(() => ({})),
}));

jest.mock("three", () => ({
  TextureLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn(() => ({})),
  })),
  MeshStandardMaterial: jest.fn(),
  Mesh: jest.fn(),
  Color: jest.fn(),
}));

describe("Smartphone3D", () => {
  const onCompleteRotation = jest.fn();

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("renders without crashing", () => {
    const { container } = render(
      <Smartphone3D triggerRotation={false} onCompleteRotation={onCompleteRotation} />
    );
    expect(container).toBeTruthy();
  });

  it("renders the Canvas", () => {
    render(
      <Smartphone3D triggerRotation={false} onCompleteRotation={onCompleteRotation} />
    );
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
  });

  it("accepts triggerRotation prop", () => {
    expect(() => {
      render(
        <Smartphone3D triggerRotation={true} onCompleteRotation={onCompleteRotation} />
      );
    }).not.toThrow();
  });
});
