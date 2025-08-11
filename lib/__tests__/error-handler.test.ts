import { z } from 'zod'
import { fromErrorToActionState, toActionState, EMPTY_ACTION_STATE } from '../error-handler'

describe('lib/error-handler', () => {
  describe('EMPTY_ACTION_STATE', () => {
    it('should have correct structure', () => {
      expect(EMPTY_ACTION_STATE).toEqual({
        message: '',
        fieldErrors: {},
      })
    })
  })

  describe('toActionState', () => {
    it('should create action state with message', () => {
      const result = toActionState('Success message')
      expect(result).toEqual({
        message: 'Success message',
        fieldErrors: {},
      })
    })

    it('should handle empty message', () => {
      const result = toActionState('')
      expect(result).toEqual({
        message: '',
        fieldErrors: {},
      })
    })

    it('should handle special characters in message', () => {
      const message = 'Success! @#$%^&*()_+-=[]{}|;:,.<>?'
      const result = toActionState(message)
      expect(result.message).toBe(message)
    })
  })

  describe('fromErrorToActionState', () => {
    it('should handle ZodError with field errors', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be 18 or older'),
      })

      try {
        schema.parse({
          name: '',
          email: 'invalid-email',
          age: 15,
        })
      } catch (error) {
        const result = fromErrorToActionState(error)
        
        expect(result.message).toBe('')
        expect(result.fieldErrors).toHaveProperty('name')
        expect(result.fieldErrors).toHaveProperty('email') 
        expect(result.fieldErrors).toHaveProperty('age')
        expect(Array.isArray(result.fieldErrors.name)).toBe(true)
        expect(result.fieldErrors.name).toEqual(['Name is required'])
        expect(result.fieldErrors.email).toEqual(['Invalid email'])
        expect(result.fieldErrors.age).toEqual(['Must be 18 or older'])
      }
    })

    it('should handle regular Error objects', () => {
      const error = new Error('Something went wrong')
      const result = fromErrorToActionState(error)
      
      expect(result.message).toBe('Something went wrong')
      expect(result.fieldErrors).toEqual({})
    })

    it('should handle Error with empty message', () => {
      const error = new Error('')
      const result = fromErrorToActionState(error)
      
      expect(result.message).toBe('')
      expect(result.fieldErrors).toEqual({})
    })

    it('should handle null and undefined', () => {
      const nullResult = fromErrorToActionState(null)
      const undefinedResult = fromErrorToActionState(undefined)
      
      expect(nullResult.message).toBe('An unknown error occurred')
      expect(nullResult.fieldErrors).toEqual({})
      expect(undefinedResult.message).toBe('An unknown error occurred')
      expect(undefinedResult.fieldErrors).toEqual({})
    })

    it('should handle unknown object errors', () => {
      const unknownError = { weird: 'object' }
      const result = fromErrorToActionState(unknownError)
      
      expect(result.message).toBe('An unknown error occurred')
      expect(result.fieldErrors).toEqual({})
    })

    it('should handle string errors', () => {
      const result = fromErrorToActionState('String error message')
      
      expect(result.message).toBe('An unknown error occurred')
      expect(result.fieldErrors).toEqual({})
    })

    it('should handle ZodError with multiple errors on same field', () => {
      const schema = z.object({
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain uppercase letter')
          .regex(/[0-9]/, 'Password must contain number'),
      })

      try {
        schema.parse({ password: 'short' })
      } catch (error) {
        const result = fromErrorToActionState(error)
        
        expect(result.fieldErrors).toHaveProperty('password')
        expect(Array.isArray(result.fieldErrors.password)).toBe(true)
        expect(result.fieldErrors.password!.length).toBeGreaterThan(0)
      }
    })
  })
})