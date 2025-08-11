import { AppOrderSchema, AppOrderInput, AppOrder } from '../app_order.schema';

describe('AppOrderSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid app order data', () => {
      const validInput: AppOrderInput = {
        order_number: 'ORD-001',
        total_points: 100,
      };

      const result = AppOrderSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should parse with all fields', () => {
      const validInput: AppOrderInput = {
        id: '1',
        order_number: 'ORD-002',
        creation_date: '2023-01-01',
        total_points: 150,
        observations: 'Test order',
      };

      const result = AppOrderSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should fail when order_number is empty', () => {
      const invalidInput = {
        order_number: '',
        total_points: 100,
      };
      const result = AppOrderSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should fail when total_points is not an integer', () => {
      const invalidInput = {
        order_number: 'ORD-001',
        total_points: 10.5,
      };
      const result = AppOrderSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});