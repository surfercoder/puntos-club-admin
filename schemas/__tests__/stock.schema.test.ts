import { StockSchema } from '../stock.schema';

describe('StockSchema', () => {
  it('should parse valid stock data', () => {
    const validInput = {
      branch_id: 'branch-1',
      product_id: 'product-1',
      quantity: 10,
      minimum_quantity: 5,
    };
    const result = StockSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should fail when quantities are negative', () => {
    const invalidInput = {
      branch_id: 'branch-1',
      product_id: 'product-1',
      quantity: -1,
      minimum_quantity: 5,
    };
    const result = StockSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});