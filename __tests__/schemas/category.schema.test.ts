import { CategorySchema } from '@/schemas/category.schema';

describe('CategorySchema', () => {
  const validCategory = {
    name: 'Electronics',
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = CategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should accept all optional fields', () => {
      const result = CategorySchema.safeParse({
        ...validCategory,
        id: 'cat-1',
        parent_id: 'parent-1',
        description: 'All electronics',
        active: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parent_id).toBe('parent-1');
        expect(result.data.description).toBe('All electronics');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing name', () => {
      const result = CategorySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = CategorySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform empty parent_id to null', () => {
      const result = CategorySchema.safeParse({ ...validCategory, parent_id: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parent_id).toBeNull();
      }
    });

    it('should transform "null" string parent_id to null', () => {
      const result = CategorySchema.safeParse({ ...validCategory, parent_id: 'null' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parent_id).toBeNull();
      }
    });

    it('should accept null for parent_id', () => {
      const result = CategorySchema.safeParse({ ...validCategory, parent_id: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parent_id).toBeNull();
      }
    });

    it('should keep valid parent_id string', () => {
      const result = CategorySchema.safeParse({ ...validCategory, parent_id: 'cat-parent' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parent_id).toBe('cat-parent');
      }
    });

    it('should transform empty description to null', () => {
      const result = CategorySchema.safeParse({ ...validCategory, description: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it('should transform null description to null', () => {
      const result = CategorySchema.safeParse({ ...validCategory, description: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it('should keep valid description string', () => {
      const result = CategorySchema.safeParse({ ...validCategory, description: 'A description' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('A description');
      }
    });

    it('should transform string "true" to boolean true for active', () => {
      const result = CategorySchema.safeParse({ ...validCategory, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "on" to boolean true for active', () => {
      const result = CategorySchema.safeParse({ ...validCategory, active: 'on' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for active', () => {
      const result = CategorySchema.safeParse({ ...validCategory, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should keep boolean values for active', () => {
      const resultTrue = CategorySchema.safeParse({ ...validCategory, active: true });
      const resultFalse = CategorySchema.safeParse({ ...validCategory, active: false });
      expect(resultTrue.success).toBe(true);
      expect(resultFalse.success).toBe(true);
      if (resultTrue.success) expect(resultTrue.data.active).toBe(true);
      if (resultFalse.success) expect(resultFalse.data.active).toBe(false);
    });

    it('should default active to true when omitted', () => {
      const result = CategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });
});
