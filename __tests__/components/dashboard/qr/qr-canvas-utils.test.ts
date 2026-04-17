import { generateQRBlob } from '@/components/dashboard/qr/qr-canvas-utils';
import type { RefObject } from 'react';

// Mock canvas context
const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  textAlign: '',
  font: '',
  fillRect: jest.fn(),
  drawImage: jest.fn(),
  beginPath: jest.fn(),
  roundRect: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
};

// Mock canvas element
const mockToBlob = jest.fn();
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => mockCtx),
  toBlob: mockToBlob,
};

// Mock SVG element
const mockSvgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
mockSvgEl.setAttribute('data-testid', 'qr-code');

// Mock XMLSerializer
const mockSerializeToString = jest.fn(() => '<svg>mock</svg>');
(global as unknown as Record<string, unknown>).XMLSerializer = jest.fn(() => ({
  serializeToString: mockSerializeToString,
}));

// Track images created
let capturedImages: Array<{
  img: { onload: (() => void) | null; onerror: ((e: unknown) => void) | null; src: string; crossOrigin: string; width: number; height: number };
}> = [];

const originalImage = window.Image;

function setupImageMock(options?: { failOnSrc?: string }) {
  capturedImages = [];
  (window as unknown as Record<string, unknown>).Image = jest.fn(() => {
    const img = {
      onload: null as (() => void) | null,
      onerror: null as ((e: unknown) => void) | null,
      src: '',
      crossOrigin: '',
      width: 200,
      height: 100,
    };
    const entry = { img };
    capturedImages.push(entry);

    // Use defineProperty to trigger onload/onerror when src is set
    let _src = '';
    Object.defineProperty(img, 'src', {
      get: () => _src,
      set: (val: string) => {
        _src = val;
        if (options?.failOnSrc && val.includes(options.failOnSrc)) {
          setTimeout(() => img.onerror?.(new Error('load failed')), 0);
        } else {
          setTimeout(() => img.onload?.(), 0);
        }
      },
    });
    return img;
  });
}

// Mock URL.createObjectURL / revokeObjectURL
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  jest.clearAllMocks();
  setupImageMock();
  URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = jest.fn();
  document.createElement = jest.fn((tag: string) => {
    if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
    return document.createElementNS('http://www.w3.org/1999/xhtml', tag);
  });
  mockToBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
    cb(new Blob(['mock'], { type: 'image/png' }));
  });
});

afterAll(() => {
  (window as unknown as Record<string, unknown>).Image = originalImage;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

function makeRef(hasSvg: boolean): RefObject<HTMLDivElement | null> {
  if (!hasSvg) {
    return { current: document.createElement('div') } as RefObject<HTMLDivElement | null>;
  }
  const div = document.createElement('div');
  div.appendChild(mockSvgEl);
  return { current: div } as RefObject<HTMLDivElement | null>;
}

const mockT = (key: string) => {
  if (key === 'printTagline') return 'scan this code to earn points';
  return key;
};

describe('generateQRBlob', () => {
  it('returns null when no svg element found', async () => {
    const ref = makeRef(false);
    const result = await generateQRBlob(ref, mockT, 'Test Org');
    expect(result).toBeNull();
  });

  it('returns null when ref.current is null', async () => {
    const ref = { current: null } as RefObject<HTMLDivElement | null>;
    const result = await generateQRBlob(ref, mockT, 'Test Org');
    expect(result).toBeNull();
  });

  it('returns null when canvas context is unavailable', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null);
    const ref = makeRef(true);
    const result = await generateQRBlob(ref, mockT, 'Test Org');
    expect(result).toBeNull();
  });

  it('generates blob successfully without logoUrl', async () => {
    const ref = makeRef(true);
    const result = await generateQRBlob(ref, mockT, 'Test Org');
    expect(result).toBeInstanceOf(Blob);
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('generates blob successfully with logoUrl', async () => {
    const ref = makeRef(true);
    const result = await generateQRBlob(ref, mockT, 'Test Org', 'http://example.com/logo.png');
    expect(result).toBeInstanceOf(Blob);
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  it('falls back to text when org logo fails to load', async () => {
    setupImageMock({ failOnSrc: 'example.com/logo' });
    const ref = makeRef(true);
    const result = await generateQRBlob(ref, mockT, 'Test Org', 'http://example.com/logo.png');
    expect(result).toBeInstanceOf(Blob);
    // Should still draw text as fallback
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('skips LogoTitle when image fails to load', async () => {
    setupImageMock({ failOnSrc: 'LogoTitle' });
    const ref = makeRef(true);
    const result = await generateQRBlob(ref, mockT, 'Test Org');
    expect(result).toBeInstanceOf(Blob);
  });

  it('handles tagline word wrapping', async () => {
    // Make measureText return wide width to force line breaks
    mockCtx.measureText.mockReturnValue({ width: 9999 });
    const ref = makeRef(true);
    const result = await generateQRBlob(ref, mockT, 'Test Org');
    expect(result).toBeInstanceOf(Blob);
    // Reset
    mockCtx.measureText.mockReturnValue({ width: 10 });
  });

  it('handles toBlob returning null', async () => {
    mockToBlob.mockImplementationOnce((cb: (blob: Blob | null) => void) => {
      cb(null);
    });
    const ref = makeRef(true);
    const result = await generateQRBlob(ref, mockT, 'Test Org');
    expect(result).toBeNull();
  });
});
