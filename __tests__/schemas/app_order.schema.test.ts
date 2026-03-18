import { AppOrderSchema } from '@/schemas/app_order.schema';

describe('AppOrderSchema', () => {
  const validOrder = {
    order_number: 'ORD-001',
    total_points: 100,
  };

  describe('valid input', () => {
    it('should accept minimal valid input with number total_points', () => {
      const result = AppOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_points).toBe(100);
      }
    });

    it('should accept all optional fields', () => {
      const result = AppOrderSchema.safeParse({
        ...validOrder,
        id: 'order-1',
        creation_date: '2024-01-01',
        observations: 'Some notes',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.observations).toBe('Some notes');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing order_number', () => {
      const result = AppOrderSchema.safeParse({ total_points: 100 });
      expect(result.success).toBe(false);
    });

    it('should reject missing total_points', () => {
      const result = AppOrderSchema.safeParse({ order_number: 'ORD-001' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string total_points to number', () => {
      const result = AppOrderSchema.safeParse({ ...validOrder, total_points: '250' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_points).toBe(250);
      }
    });

    it('should transform non-numeric string total_points to 0', () => {
      const result = AppOrderSchema.safeParse({ ...validOrder, total_points: 'abc' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_points).toBe(0);
      }
    });

    it('should keep number total_points as-is', () => {
      const result = AppOrderSchema.safeParse({ ...validOrder, total_points: 42 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_points).toBe(42);
      }
    });

    it('should transform empty observations to null', () => {
      const result = AppOrderSchema.safeParse({ ...validOrder, observations: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.observations).toBeNull();
      }
    });

    it('should keep non-empty observations as string', () => {
      const result = AppOrderSchema.safeParse({ ...validOrder, observations: 'Note' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.observations).toBe('Note');
      }
    });

    it('should leave omitted observations as undefined', () => {
      const result = AppOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        // optional fields omitted remain undefined
        expect(result.data.observations).toBeUndefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should reject empty string for order_number', () => {
      const result = AppOrderSchema.safeParse({ ...validOrder, order_number: '' });
      expect(result.success).toBe(false);
    });

    it('should accept string "0" for total_points', () => {
      const result = AppOrderSchema.safeParse({ ...validOrder, total_points: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_points).toBe(0);
      }
    });
  });
});
