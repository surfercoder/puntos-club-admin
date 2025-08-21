import type { SubcategoryInput, Subcategory } from '../subcategory.schema';
import { SubcategorySchema } from '../subcategory.schema';

describe('SubcategorySchema', () => {
  describe('valid inputs', () => {
    it('should parse valid subcategory data with all fields', () => {
      const validInput: SubcategoryInput = {
        id: '1',
        category_id: 'cat-1',
        name: 'Test Subcategory',
        description: 'Test description',
        active: true,
      };

      const result = SubcategorySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse valid subcategory data with minimal fields', () => {
      const validInput: SubcategoryInput = {
        category_id: 'cat-1',
        name: 'Test Subcategory',
      };

      const result = SubcategorySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual({
          category_id: 'cat-1',
          name: 'Test Subcategory',
          active: true,
        });
      }
    });

    it('should parse subcategory data with null description', () => {
      const validInput: SubcategoryInput = {
        category_id: 'cat-1',
        name: 'Test Subcategory',
        description: null,
        active: false,
      };

      const result = SubcategorySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail validation when category_id is missing', () => {
      const invalidInput = {
        name: 'Test Subcategory',
      };

      const result = SubcategorySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['category_id']);
      }
    });

    it('should fail validation when name is missing', () => {
      const invalidInput = {
        category_id: 'cat-1',
      };

      const result = SubcategorySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
      }
    });

    it('should fail validation when name is empty string', () => {
      const invalidInput: SubcategoryInput = {
        category_id: 'cat-1',
        name: '',
      };

      const result = SubcategorySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });
  });

  describe('type exports', () => {
    it('should export SubcategoryInput type', () => {
      const input: SubcategoryInput = {
        category_id: 'cat-1',
        name: 'Test',
      };
      expect(input.name).toBe('Test');
    });

    it('should export Subcategory type', () => {
      const subcategory: Subcategory = {
        category_id: 'cat-1',
        name: 'Test',
        active: true,
      };
      expect(subcategory.name).toBe('Test');
    });
  });
});