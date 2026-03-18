import { StockSchema } from '@/schemas/stock.schema';

describe('StockSchema', () => {
  const validStock = {
    branch_id: 'branch-1',
    product_id: 'prod-1',
    quantity: 10,
    minimum_quantity: 2,
  };

  describe('valid input', () => {
    it('should accept valid input with numbers', () => {
      const result = StockSchema.safeParse(validStock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(10);
        expect(result.data.minimum_quantity).toBe(2);
      }
    });

    it('should accept optional id', () => {
      const result = StockSchema.safeParse({ ...validStock, id: 'stock-1' });
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should reject missing branch_id', () => {
      const { branch_id: _branch_id, ...rest } = validStock;
      const result = StockSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing product_id', () => {
      const { product_id: _product_id, ...rest } = validStock;
      const result = StockSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing quantity', () => {
      const { quantity: _quantity, ...rest } = validStock;
      const result = StockSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing minimum_quantity', () => {
      const { minimum_quantity: _minimum_quantity, ...rest } = validStock;
      const result = StockSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty branch_id', () => {
      const result = StockSchema.safeParse({ ...validStock, branch_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty product_id', () => {
      const result = StockSchema.safeParse({ ...validStock, product_id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string quantity to number', () => {
      const result = StockSchema.safeParse({ ...validStock, quantity: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(50);
      }
    });

    it('should transform non-numeric string quantity to 0', () => {
      const result = StockSchema.safeParse({ ...validStock, quantity: 'abc' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(0);
      }
    });

    it('should transform string minimum_quantity to number', () => {
      const result = StockSchema.safeParse({ ...validStock, minimum_quantity: '5' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minimum_quantity).toBe(5);
      }
    });

    it('should transform non-numeric string minimum_quantity to 0', () => {
      const result = StockSchema.safeParse({ ...validStock, minimum_quantity: 'xyz' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minimum_quantity).toBe(0);
      }
    });

    it('should keep number values as-is', () => {
      const result = StockSchema.safeParse(validStock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(10);
        expect(result.data.minimum_quantity).toBe(2);
      }
    });
  });

  describe('edge cases', () => {
    it('should accept string "0" and transform to 0', () => {
      const result = StockSchema.safeParse({ ...validStock, quantity: '0', minimum_quantity: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(0);
        expect(result.data.minimum_quantity).toBe(0);
      }
    });
  });
});
