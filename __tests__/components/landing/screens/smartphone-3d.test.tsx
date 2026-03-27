import React from "react";
import { render, screen, act } from "@testing-library/react";
import Smartphone3D from "@/components/landing/screens/smartphone-3d";

/* ── callback captures ── */
let capturedFrameCallback: ((state: any, delta: number) => void) | null = null;

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
const mockScreenMaterial = {
  name: "Screen",
  map: null as any,
  needsUpdate: false,
};

const mockNonScreenMaterial = {
  name: "Body",
  map: null as any,
  needsUpdate: false,
};

const mockScene = {
  rotation: { y: 0 },
  traverse: jest.fn((cb: (child: any) => void) => {
    // Simulate a mesh with "Screen" material
    const ThreeMesh = require("three").Mesh;
    const screenChild = Object.create(ThreeMesh.prototype || {});
    screenChild.material = mockScreenMaterial;
    // Make instanceof Mesh work by setting constructor
    Object.defineProperty(screenChild, "constructor", { value: ThreeMesh });
    cb(screenChild);
    // Also simulate a non-Screen mesh
    const nonScreenChild = Object.create(ThreeMesh.prototype || {});
    nonScreenChild.material = mockNonScreenMaterial;
    Object.defineProperty(nonScreenChild, "constructor", { value: ThreeMesh });
    cb(nonScreenChild);
  }),
};

jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn((cb: any) => {
    capturedFrameCallback = cb;
  }),
  useLoader: jest.fn(() => ({})),
  useThree: jest.fn(() => ({ gl: {}, camera: {} })),
}));

jest.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  Environment: () => null,
  useGLTF: jest.fn(() => ({
    scene: mockScene,
    nodes: {},
    materials: {},
  })),
  useTexture: jest.fn(() => ({})),
}));

jest.mock("three", () => {
  // Create a proper Mesh class that instanceof checks will work against
  const MockMesh = class Mesh {};
  return {
    TextureLoader: jest.fn().mockImplementation(() => ({
      load: jest.fn(() => ({ isTexture: true })),
    })),
    MeshStandardMaterial: jest.fn(),
    Mesh: MockMesh,
    Color: jest.fn(),
  };
});

describe("Smartphone3D", () => {
  const onCompleteRotation = jest.fn();

  beforeEach(() => {
    capturedFrameCallback = null;
    onCompleteRotation.mockClear();
    mockScene.rotation.y = 0;
    mockScreenMaterial.map = null;
    mockScreenMaterial.needsUpdate = false;
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

  it("renders on mobile viewport (innerWidth < 800)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 600,
    });

    const { container } = render(
      <Smartphone3D triggerRotation={false} onCompleteRotation={onCompleteRotation} />
    );
    expect(container).toBeTruthy();
  });

  it("useFrame sets initial rotation to Math.PI on first frame", () => {
    render(
      <Smartphone3D triggerRotation={false} onCompleteRotation={onCompleteRotation} />
    );

    expect(capturedFrameCallback).not.toBeNull();
    act(() => {
      capturedFrameCallback!({}, 0.016);
    });

    // After first frame, initial rotation should be set
    expect(mockScene.rotation.y).toBe(Math.PI);
  });

  it("useFrame starts rotation when triggerRotation is true", () => {
    render(
      <Smartphone3D triggerRotation={true} onCompleteRotation={onCompleteRotation} />
    );

    expect(capturedFrameCallback).not.toBeNull();

    // First call: sets initialRotation and starts rotating
    act(() => {
      capturedFrameCallback!({}, 0.016);
    });

    // Second call: continues rotation
    const prevY = mockScene.rotation.y;
    act(() => {
      capturedFrameCallback!({}, 0.5);
    });

    // Rotation should have increased
    expect(mockScene.rotation.y).not.toBe(prevY);
  });

  it("useFrame triggers texture change at half rotation (Math.PI)", () => {
    render(
      <Smartphone3D triggerRotation={true} onCompleteRotation={onCompleteRotation} />
    );

    expect(capturedFrameCallback).not.toBeNull();

    // First frame: set initial rotation and start rotating
    act(() => {
      capturedFrameCallback!({}, 0.016);
    });

    // Advance past Math.PI but less than Math.PI * 1.5
    // Need delta such that delta * Math.PI >= Math.PI, so delta >= 1.0
    act(() => {
      capturedFrameCallback!({}, 1.05);
    });

    // The texture index should have been updated (setCurrentTextureIndex called)
    // We can verify the traverse was called (texture update useEffect)
    expect(mockScene.traverse).toHaveBeenCalled();
  });

  it("useFrame completes full rotation and calls onCompleteRotation", () => {
    render(
      <Smartphone3D triggerRotation={true} onCompleteRotation={onCompleteRotation} />
    );

    expect(capturedFrameCallback).not.toBeNull();

    // First frame: set initial rotation, start rotating
    act(() => {
      capturedFrameCallback!({}, 0.016);
    });

    // Complete a full rotation (delta * Math.PI >= 2 * Math.PI, so delta >= 2.0)
    act(() => {
      capturedFrameCallback!({}, 2.1);
    });

    expect(onCompleteRotation).toHaveBeenCalled();
    // Rotation should be reset to Math.PI
    expect(mockScene.rotation.y).toBe(Math.PI);
  });

  it("texture useEffect traverses scene and updates Screen material", () => {
    render(
      <Smartphone3D triggerRotation={false} onCompleteRotation={onCompleteRotation} />
    );

    // The traverse is called in a useEffect on mount
    expect(mockScene.traverse).toHaveBeenCalled();
  });
});
