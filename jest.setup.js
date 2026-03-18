// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockedLink = ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>
  }
  MockedLink.displayName = 'Link'
  return MockedLink
})

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key) => key;
    t.rich = (key, _params) => key;
    t.raw = (_key) => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signOut: jest.fn().mockResolvedValue({}),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock plan-usage-provider
jest.mock('@/components/providers/plan-usage-provider', () => ({
  usePlanUsage: jest.fn(() => ({
    summary: null,
    isLoading: false,
    invalidate: jest.fn(),
    isAtLimit: jest.fn(() => false),
    shouldWarn: jest.fn(() => false),
    getFeature: jest.fn(),
    plan: null,
  })),
  PlanUsageProvider: ({ children }) => children,
}));

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}))

// Mock React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(() => [
    { message: '', fieldErrors: {} },
    jest.fn(),
    false,
  ]),
}))

// Setup global test environment
global.fetch = jest.fn()
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Add TextEncoder/TextDecoder polyfill for Next.js compatibility
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add Web API polyfills for Next.js server components
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor() {}
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor() {}
  };
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor() {}
  };
}

// Polyfill Response.json static method for NextResponse.json compatibility
if (typeof global.Response !== 'undefined' && typeof global.Response.json !== 'function') {
  global.Response.json = function(data, init) {
    const body = JSON.stringify(data);
    const headers = new Headers(init?.headers);
    headers.set('content-type', 'application/json');
    return new Response(body, { ...init, headers });
  };
}

// Polyfill Headers.getSetCookie for Next.js NextResponse cookie support (edge runtime)
if (typeof global.Headers !== 'undefined' && !global.Headers.prototype.getSetCookie) {
  global.Headers.prototype.getSetCookie = function() {
    return [];
  };
}

// Mock next/server NextResponse for jsdom environment (edge runtime APIs not available)
jest.mock('next/server', () => {
  class MockNextResponse {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Headers(init.headers);
      this._cookies = new Map();
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      if (this._body === null || this._body === undefined) return null;
      if (typeof this._body === 'string') return JSON.parse(this._body);
      return this._body;
    }
    async text() { return typeof this._body === 'string' ? this._body : JSON.stringify(this._body); }
    get cookies() {
      return {
        set: (name, value, options) => { this._cookies.set(name, { value, options }); },
        get: (name) => this._cookies.get(name),
        delete: (name) => this._cookies.delete(name),
      };
    }
  }
  MockNextResponse.json = function(body, init) {
    const jsonBody = JSON.stringify(body);
    const headers = new Headers(init?.headers);
    headers.set('content-type', 'application/json');
    return new MockNextResponse(jsonBody, { ...init, headers });
  };
  MockNextResponse.redirect = function(url, status) {
    return new MockNextResponse(null, {
      status: status || 307,
      headers: { Location: typeof url === 'string' ? url : url.toString() },
    });
  };
  return {
    NextResponse: MockNextResponse,
    NextRequest: class extends Request {},
  };
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})