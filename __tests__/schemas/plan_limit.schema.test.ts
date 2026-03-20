import { PlanLimitSchema } from '@/schemas/plan_limit.schema';

describe('PlanLimitSchema', () => {
  const validInput = {
    plan: 'pro',
    feature: 'cashiers',
    limit_value: 50,
  };

  describe('valid input', () => {
    it('should accept minimal valid input with defaults', () => {
      const result = PlanLimitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan).toBe('pro');
        expect(result.data.feature).toBe('cashiers');
        expect(result.data.limit_value).toBe(50);
        expect(result.data.warning_threshold).toBe(0.8);
      }
    });

    it('should accept all fields', () => {
      const result = PlanLimitSchema.safeParse({
        ...validInput,
        id: 'pl-1',
        warning_threshold: 0.5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('pl-1');
        expect(result.data.warning_threshold).toBe(0.5);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing plan', () => {
      const { plan: _plan, ...rest } = validInput;
      const result = PlanLimitSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing feature', () => {
      const { feature: _feature, ...rest } = validInput;
      const result = PlanLimitSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing limit_value', () => {
      const { limit_value: _limit_value, ...rest } = validInput;
      const result = PlanLimitSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should accept "trial" plan', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, plan: 'trial' });
      expect(result.success).toBe(true);
    });

    it('should accept "advance" plan', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, plan: 'advance' });
      expect(result.success).toBe(true);
    });

    it('should accept "pro" plan', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, plan: 'pro' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid plan', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, plan: 'free' });
      expect(result.success).toBe(false);
    });

    it('should accept "beneficiaries" feature', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, feature: 'beneficiaries' });
      expect(result.success).toBe(true);
    });

    it('should accept "push_notifications_monthly" feature', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, feature: 'push_notifications_monthly' });
      expect(result.success).toBe(true);
    });

    it('should accept "cashiers" feature', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, feature: 'cashiers' });
      expect(result.success).toBe(true);
    });

    it('should accept "branches" feature', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, feature: 'branches' });
      expect(result.success).toBe(true);
    });

    it('should accept "collaborators" feature', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, feature: 'collaborators' });
      expect(result.success).toBe(true);
    });

    it('should accept "redeemable_products" feature', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, feature: 'redeemable_products' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid feature', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, feature: 'unknown' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string limit_value to number', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, limit_value: '100' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(100);
      }
    });

    it('should keep number limit_value as-is', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, limit_value: 75 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(75);
      }
    });

    it('should reject negative limit_value', () => {
      expect(() => PlanLimitSchema.parse({ ...validInput, limit_value: -5 })).toThrow();
    });

    it('should reject non-numeric string limit_value', () => {
      expect(() => PlanLimitSchema.parse({ ...validInput, limit_value: 'abc' })).toThrow();
    });

    it('should transform string warning_threshold to number', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, warning_threshold: '0.6' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warning_threshold).toBe(0.6);
      }
    });

    it('should default non-numeric string warning_threshold to 0.8', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, warning_threshold: 'invalid' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warning_threshold).toBe(0.8);
      }
    });
  });

  describe('edge cases', () => {
    it('should default warning_threshold to 0.8 when omitted', () => {
      const result = PlanLimitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warning_threshold).toBe(0.8);
      }
    });

    it('should leave id undefined when omitted', () => {
      const result = PlanLimitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should accept limit_value of 0', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, limit_value: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(0);
      }
    });

    it('should accept string "0" as limit_value', () => {
      const result = PlanLimitSchema.safeParse({ ...validInput, limit_value: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(0);
      }
    });
  });
});
