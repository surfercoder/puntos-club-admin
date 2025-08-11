import { cn } from '../utils'

// Mock environment variables for hasEnvVars test
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('lib/utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle tailwind merge conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })

    it('should handle empty string', () => {
      expect(cn('')).toBe('')
      expect(cn('', 'valid')).toBe('valid')
    })

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
      expect(cn({ 'class1': true, 'class2': false })).toBe('class1')
    })

    it('should handle complex combinations', () => {
      const result = cn(
        'base-class',
        true && 'conditional-true',
        false && 'conditional-false',
        { 'object-true': true, 'object-false': false },
        ['array1', 'array2'],
        'p-4 p-2' // Should merge to p-2
      )
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-true')
      expect(result).not.toContain('conditional-false')
      expect(result).toContain('object-true')
      expect(result).not.toContain('object-false')
      expect(result).toContain('array1')
      expect(result).toContain('array2')
      expect(result).toContain('p-2')
      expect(result).not.toContain('p-4')
    })
  })

  describe('hasEnvVars constant', () => {
    // We need to import hasEnvVars dynamically to test it with different env vars
    it('should return truthy when all required env vars are present', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-url'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      // Import the constant after setting env vars
      const { hasEnvVars } = await import('../utils')
      expect(hasEnvVars).toBeTruthy()
    })

    it('should return falsy when SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      const { hasEnvVars } = await import('../utils')
      expect(hasEnvVars).toBeFalsy()
    })

    it('should return falsy when SUPABASE_ANON_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-url'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const { hasEnvVars } = await import('../utils')
      expect(hasEnvVars).toBeFalsy()
    })

    it('should return falsy when both env vars are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const { hasEnvVars } = await import('../utils')
      expect(hasEnvVars).toBeFalsy()
    })

    it('should return the ANON_KEY value when both are present', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-url'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      const { hasEnvVars } = await import('../utils')
      expect(hasEnvVars).toBe('test-key')
    })
  })
})