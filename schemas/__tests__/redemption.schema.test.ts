import { RedemptionSchema } from '../redemption.schema';

describe('RedemptionSchema', () => {
  it('should parse valid redemption data', () => {
    const validInput = {
      beneficiary_id: 'ben-1',
      order_id: 'order-1',
      points_used: 50,
      quantity: 1,
    };
    const result = RedemptionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should fail when required fields are missing', () => {
    const result = RedemptionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});