import { CategorySchema, type CategoryInput, type Category } from '../category.schema'

describe('schemas/category.schema', () => {
  describe('CategorySchema', () => {
    const validCategoryData = {
      name: 'Test Category',
      description: 'Test description',
      active: true,
    }

    it('should parse valid category data', () => {
      const result = CategorySchema.parse(validCategoryData)
      expect(result).toEqual({
        name: 'Test Category',
        description: 'Test description', 
        active: true,
      })
    })

    it('should parse valid category data with id', () => {
      const dataWithId = { ...validCategoryData, id: '123' }
      const result = CategorySchema.parse(dataWithId)
      expect(result).toEqual({
        id: '123',
        name: 'Test Category',
        description: 'Test description',
        active: true,
      })
    })

    it('should parse minimal required fields', () => {
      const minimalData = { name: 'Minimal Category' }
      const result = CategorySchema.parse(minimalData)
      expect(result).toEqual({
        name: 'Minimal Category',
        active: true, // default value
      })
    })

    it('should handle null description', () => {
      const dataWithNullDesc = { ...validCategoryData, description: null }
      const result = CategorySchema.parse(dataWithNullDesc)
      expect(result.description).toBeNull()
    })

    it('should handle undefined description', () => {
      const { description, ...dataWithoutDesc } = validCategoryData
      const result = CategorySchema.parse(dataWithoutDesc)
      expect(result.description).toBeUndefined()
    })

    it('should default active to true when not provided', () => {
      const dataWithoutActive = { name: 'Test Category' }
      const result = CategorySchema.parse(dataWithoutActive)
      expect(result.active).toBe(true)
    })

    it('should accept explicit active false', () => {
      const dataWithActiveFalse = { ...validCategoryData, active: false }
      const result = CategorySchema.parse(dataWithActiveFalse)
      expect(result.active).toBe(false)
    })

    it('should reject empty name', () => {
      const invalidData = { ...validCategoryData, name: '' }
      expect(() => CategorySchema.parse(invalidData)).toThrow()
    })

    it('should reject missing name', () => {
      const { name, ...invalidData } = validCategoryData
      expect(() => CategorySchema.parse(invalidData)).toThrow()
    })

    it('should reject non-string name', () => {
      const invalidData = { ...validCategoryData, name: 123 }
      expect(() => CategorySchema.parse(invalidData)).toThrow()
    })

    it('should reject non-string id', () => {
      const invalidData = { ...validCategoryData, id: 123 }
      expect(() => CategorySchema.parse(invalidData)).toThrow()
    })

    it('should reject non-boolean active', () => {
      const invalidData = { ...validCategoryData, active: 'true' }
      expect(() => CategorySchema.parse(invalidData)).toThrow()
    })

    it('should handle empty string description', () => {
      const dataWithEmptyDesc = { ...validCategoryData, description: '' }
      const result = CategorySchema.parse(dataWithEmptyDesc)
      expect(result.description).toBe('')
    })

    it('should handle long description', () => {
      const longDescription = 'A'.repeat(1000)
      const dataWithLongDesc = { ...validCategoryData, description: longDescription }
      const result = CategorySchema.parse(dataWithLongDesc)
      expect(result.description).toBe(longDescription)
    })
  })

  describe('Type exports', () => {
    it('should export CategoryInput type', () => {
      const input: CategoryInput = {
        name: 'Test',
        description: 'Description',
        active: true,
      }
      expect(typeof input).toBe('object')
    })

    it('should export Category type', () => {
      const category: Category = {
        name: 'Test',
        description: 'Description',
        active: true,
      }
      expect(typeof category).toBe('object')
    })

    it('should allow optional fields in CategoryInput', () => {
      const input: CategoryInput = { name: 'Test' }
      expect(input.name).toBe('Test')
    })

    it('should allow id in Category type', () => {
      const category: Category = {
        id: '123',
        name: 'Test',
        active: true,
      }
      expect(category.id).toBe('123')
    })
  })
})