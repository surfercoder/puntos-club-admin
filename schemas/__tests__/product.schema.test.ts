import type { ProductInput, Product } from '../product.schema';
import { ProductSchema } from '../product.schema';

describe('ProductSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid product data with all fields', () => {
      const validInput: ProductInput = {
        id: '1',
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: 100,
        active: true,
        creation_date: '2023-01-01',
      };

      const result = ProductSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse valid product data with minimal fields', () => {
      const validInput: ProductInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: 100,
      };

      const result = ProductSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual({
          subcategory_id: 'subcat-1',
          name: 'Test Product',
          required_points: 100,
          active: true, // default value
        });
      }
    });

    it('should parse product data with null description', () => {
      const validInput: ProductInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: null,
        required_points: 0,
        active: false,
      };

      const result = ProductSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it('should parse product data with zero required_points', () => {
      const validInput: ProductInput = {
        subcategory_id: 'subcat-1',
        name: 'Free Product',
        required_points: 0,
      };

      const result = ProductSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.required_points).toBe(0);
      }
    });

    it('should apply default value for active field', () => {
      const validInput: ProductInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: 100,
      };

      const result = ProductSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail validation when subcategory_id is missing', () => {
      const invalidInput = {
        name: 'Test Product',
        required_points: 100,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['subcategory_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when name is missing', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        required_points: 100,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when name is empty string', () => {
      const invalidInput: ProductInput = {
        subcategory_id: 'subcat-1',
        name: '',
        required_points: 100,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should fail validation when required_points is missing', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['required_points']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when required_points is not a number', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: '100',
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['required_points']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when required_points is not an integer', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: 100.5,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['required_points']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when required_points is negative', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: -1,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['required_points']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should fail validation when active is not a boolean', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: 100,
        active: 'true',
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['active']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when description is not a string or null', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 123,
        required_points: 100,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['description']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when subcategory_id is not a string', () => {
      const invalidInput = {
        subcategory_id: 123,
        name: 'Test Product',
        required_points: 100,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['subcategory_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when id is not a string', () => {
      const invalidInput = {
        id: 123,
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: 100,
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when creation_date is not a string', () => {
      const invalidInput = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: 100,
        creation_date: new Date(),
      };

      const result = ProductSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['creation_date']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = ProductSchema.safeParse({});
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
        const paths = result.error.issues.map(issue => issue.path[0]);
        expect(paths).toContain('subcategory_id');
        expect(paths).toContain('name');
        expect(paths).toContain('required_points');
      }
    });

    it('should handle null input', () => {
      const result = ProductSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = ProductSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should handle extra fields by ignoring them', () => {
      const inputWithExtra = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        required_points: 100,
        extraField: 'should be ignored',
      };

      const result = ProductSchema.safeParse(inputWithExtra);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('type exports', () => {
    it('should export ProductInput type', () => {
      const input: ProductInput = {
        subcategory_id: 'subcat-1',
        name: 'Test',
        required_points: 100,
      };
      expect(input.name).toBe('Test');
    });

    it('should export Product type', () => {
      const product: Product = {
        subcategory_id: 'subcat-1',
        name: 'Test',
        required_points: 100,
        active: true,
      };
      expect(product.name).toBe('Test');
    });
  });
});