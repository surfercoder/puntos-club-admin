import { PurchaseSchema } from '@/schemas/purchase.schema';

describe('PurchaseSchema', () => {
  const validInput = {
    beneficiary_id: 'ben-1',
    cashier_id: 'cashier-1',
    total_amount: 1500.50,
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = PurchaseSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.beneficiary_id).toBe('ben-1');
        expect(result.data.cashier_id).toBe('cashier-1');
        expect(result.data.total_amount).toBe(1500.50);
      }
    });

    it('should accept all fields', () => {
      const result = PurchaseSchema.safeParse({
        ...validInput,
        id: 'pur-1',
        branch_id: 'branch-1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('pur-1');
        expect(result.data.branch_id).toBe('branch-1');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing beneficiary_id', () => {
      const { beneficiary_id: _beneficiary_id, ...rest } = validInput;
      const result = PurchaseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty beneficiary_id', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, beneficiary_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing cashier_id', () => {
      const { cashier_id: _cashier_id, ...rest } = validInput;
      const result = PurchaseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty cashier_id', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, cashier_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing total_amount', () => {
      const { total_amount: _total_amount, ...rest } = validInput;
      const result = PurchaseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string total_amount to number', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, total_amount: '2500.75' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_amount).toBe(2500.75);
      }
    });

    it('should keep number total_amount as-is', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, total_amount: 999 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_amount).toBe(999);
      }
    });

    it('should reject negative total_amount', () => {
      expect(() => PurchaseSchema.parse({ ...validInput, total_amount: -10 })).toThrow();
    });

    it('should reject non-numeric string total_amount', () => {
      expect(() => PurchaseSchema.parse({ ...validInput, total_amount: 'abc' })).toThrow();
    });

    it('should transform empty branch_id to null', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, branch_id: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch_id).toBeNull();
      }
    });

    it('should keep valid branch_id string', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, branch_id: 'branch-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch_id).toBe('branch-1');
      }
    });

    it('should accept null branch_id', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, branch_id: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch_id).toBeNull();
      }
    });
  });

  describe('edge cases', () => {
    it('should leave id undefined when omitted', () => {
      const result = PurchaseSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should accept total_amount of 0', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, total_amount: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_amount).toBe(0);
      }
    });
  });
});
