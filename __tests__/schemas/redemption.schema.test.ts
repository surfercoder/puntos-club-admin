import { RedemptionSchema } from '@/schemas/redemption.schema';

describe('RedemptionSchema', () => {
  const validRedemption = {
    beneficiary_id: 'ben-1',
    order_id: 'order-1',
    points_used: 100,
    quantity: 1,
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = RedemptionSchema.safeParse(validRedemption);
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = RedemptionSchema.safeParse({
        ...validRedemption,
        id: 'red-1',
        product_id: 'prod-1',
        redemption_date: '2024-01-01',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_id).toBe('prod-1');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing beneficiary_id', () => {
      const { beneficiary_id: _beneficiary_id, ...rest } = validRedemption;
      const result = RedemptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing order_id', () => {
      const { order_id: _order_id, ...rest } = validRedemption;
      const result = RedemptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing points_used', () => {
      const { points_used: _points_used, ...rest } = validRedemption;
      const result = RedemptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing quantity', () => {
      const { quantity: _quantity, ...rest } = validRedemption;
      const result = RedemptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty beneficiary_id', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, beneficiary_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty order_id', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, order_id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string points_used to number', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, points_used: '250' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.points_used).toBe(250);
      }
    });

    it('should transform non-numeric string points_used to 0', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, points_used: 'abc' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.points_used).toBe(0);
      }
    });

    it('should keep number points_used as-is', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, points_used: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.points_used).toBe(50);
      }
    });

    it('should transform string quantity to number', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, quantity: '3' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(3);
      }
    });

    it('should transform non-numeric string quantity to 0', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, quantity: 'xyz' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(0);
      }
    });

    it('should transform empty product_id to null', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, product_id: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_id).toBeNull();
      }
    });

    it('should transform "none" product_id to null', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, product_id: 'none' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_id).toBeNull();
      }
    });

    it('should keep valid product_id string', () => {
      const result = RedemptionSchema.safeParse({ ...validRedemption, product_id: 'prod-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_id).toBe('prod-1');
      }
    });
  });

  describe('edge cases', () => {
    it('should leave omitted product_id as undefined', () => {
      const result = RedemptionSchema.safeParse(validRedemption);
      expect(result.success).toBe(true);
      if (result.success) {
        // optional fields omitted remain undefined
        expect(result.data.product_id).toBeUndefined();
      }
    });
  });
});
