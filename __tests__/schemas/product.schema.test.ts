import { ProductSchema } from '@/schemas/product.schema';

describe('ProductSchema', () => {
  const validProduct = {
    category_id: 'cat-1',
    name: 'Mug',
    required_points: 100,
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should accept all optional fields', () => {
      const result = ProductSchema.safeParse({
        ...validProduct,
        id: 'prod-1',
        description: 'A nice mug',
        active: false,
        creation_date: '2024-01-01',
        image_urls: ['https://example.com/img1.png', 'https://example.com/img2.png'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('A nice mug');
        expect(result.data.image_urls).toHaveLength(2);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing category_id', () => {
      const result = ProductSchema.safeParse({ name: 'Mug', required_points: 100 });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = ProductSchema.safeParse({ category_id: 'cat-1', required_points: 100 });
      expect(result.success).toBe(false);
    });

    it('should reject missing required_points', () => {
      const result = ProductSchema.safeParse({ category_id: 'cat-1', name: 'Mug' });
      expect(result.success).toBe(false);
    });

    it('should reject empty category_id', () => {
      const result = ProductSchema.safeParse({ ...validProduct, category_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = ProductSchema.safeParse({ ...validProduct, name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string required_points to number', () => {
      const result = ProductSchema.safeParse({ ...validProduct, required_points: '250' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.required_points).toBe(250);
      }
    });

    it('should transform non-numeric string required_points to 0', () => {
      const result = ProductSchema.safeParse({ ...validProduct, required_points: 'abc' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.required_points).toBe(0);
      }
    });

    it('should keep number required_points as-is', () => {
      const result = ProductSchema.safeParse({ ...validProduct, required_points: 42 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.required_points).toBe(42);
      }
    });

    it('should transform empty description to null', () => {
      const result = ProductSchema.safeParse({ ...validProduct, description: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it('should keep non-empty description', () => {
      const result = ProductSchema.safeParse({ ...validProduct, description: 'Details' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Details');
      }
    });

    it('should transform string "true" to boolean true for active', () => {
      const result = ProductSchema.safeParse({ ...validProduct, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "on" to boolean true for active', () => {
      const result = ProductSchema.safeParse({ ...validProduct, active: 'on' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for active', () => {
      const result = ProductSchema.safeParse({ ...validProduct, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should keep boolean values for active', () => {
      const result = ProductSchema.safeParse({ ...validProduct, active: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should default active to true when omitted', () => {
      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('image_urls', () => {
    it('should accept up to 3 image URLs', () => {
      const result = ProductSchema.safeParse({
        ...validProduct,
        image_urls: ['url1', 'url2', 'url3'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject more than 3 image URLs', () => {
      const result = ProductSchema.safeParse({
        ...validProduct,
        image_urls: ['url1', 'url2', 'url3', 'url4'],
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty array', () => {
      const result = ProductSchema.safeParse({ ...validProduct, image_urls: [] });
      expect(result.success).toBe(true);
    });

    it('should accept omitted image_urls', () => {
      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.image_urls).toBeUndefined();
      }
    });
  });
});
