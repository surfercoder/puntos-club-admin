const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  testEnvironment: 'jsdom',

  // Coverage configuration
  coverageProvider: 'v8',
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'schemas/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'actions/**/*.{ts,tsx}',
    'i18n/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    // Type-only files (no runtime code)
    '!types/**',
    // Config files
    '!next.config.ts',
    '!tailwind.config.ts',
    '!playwright.config.ts',
    '!proxy.ts',
    '!scripts/**',
    // Shadcn UI components (auto-generated third-party)
    '!components/ui/avatar.tsx',
    '!components/ui/badge.tsx',
    '!components/ui/breadcrumb.tsx',
    '!components/ui/button.tsx',
    '!components/ui/card.tsx',
    '!components/ui/checkbox.tsx',
    '!components/ui/collapsible.tsx',
    '!components/ui/dialog.tsx',
    '!components/ui/dropdown-menu.tsx',
    '!components/ui/input.tsx',
    '!components/ui/label.tsx',
    '!components/ui/select.tsx',
    '!components/ui/separator.tsx',
    '!components/ui/sheet.tsx',
    '!components/ui/sidebar.tsx',
    '!components/ui/skeleton.tsx',
    '!components/ui/sonner.tsx',
    '!components/ui/switch.tsx',
    '!components/ui/table.tsx',
    '!components/ui/textarea.tsx',
    '!components/ui/tooltip.tsx',
    // Supabase client files (infrastructure wrappers, tested via integration)
    '!lib/supabase/admin.ts',
    '!lib/supabase/client.ts',
    '!lib/supabase/server.ts',
    '!lib/supabase/middleware.ts',
    // MercadoPago client (external service wrapper)
    '!lib/mercadopago/client.ts',
    // Google Maps integration (requires Google Maps JS API)
    '!components/ui/google-address-autocomplete.tsx',
    '!components/providers/google-maps-provider.tsx',
    // Complex image upload component (requires file API + Supabase storage)
    '!components/ui/image-upload.tsx',
    // Onboarding wizard (complex multi-step flow, tested via e2e)
    '!components/onboarding/**',
    // Complex dashboard components requiring deep external deps
    '!components/dashboard/branch/branch-form-with-address.tsx',
    // Product image upload (requires file upload, canvas, supabase storage)
    '!components/dashboard/product/product-image-upload.tsx',
    // QR display (requires qrcode.react, complex canvas rendering)
    '!components/dashboard/qr/org-qr-display.tsx',
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 65,
      lines: 80,
      statements: 80,
    },
  },
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3001',
  },

  // Disable watchman to avoid permission issues
  watchman: false,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)