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

// Supabase mocks will be added in individual test files as needed

// UI component mocks are handled in individual test files as needed

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

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})