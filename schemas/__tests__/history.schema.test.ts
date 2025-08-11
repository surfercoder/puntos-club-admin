import { HistorySchema } from '../history.schema';

describe('HistorySchema', () => {
  it('should parse valid history data', () => {
    const validInput = { order_id: 'order-1' };
    const result = HistorySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should fail when order_id is missing', () => {
    const result = HistorySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});