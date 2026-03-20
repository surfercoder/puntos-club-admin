import { OrganizationPlanLimitSchema } from '@/schemas/organization_plan_limit.schema';

describe('OrganizationPlanLimitSchema', () => {
  const validInput = {
    organization_id: 'org-1',
    plan: 'advance',
    feature: 'beneficiaries',
    limit_value: 100,
  };

  describe('valid input', () => {
    it('should accept minimal valid input with defaults', () => {
      const result = OrganizationPlanLimitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organization_id).toBe('org-1');
        expect(result.data.plan).toBe('advance');
        expect(result.data.feature).toBe('beneficiaries');
        expect(result.data.limit_value).toBe(100);
        expect(result.data.warning_threshold).toBe(0.8);
      }
    });

    it('should accept all fields', () => {
      const result = OrganizationPlanLimitSchema.safeParse({
        ...validInput,
        id: 'opl-1',
        warning_threshold: 0.9,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('opl-1');
        expect(result.data.warning_threshold).toBe(0.9);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing organization_id', () => {
      const { organization_id: _organization_id, ...rest } = validInput;
      const result = OrganizationPlanLimitSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty organization_id', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, organization_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing plan', () => {
      const { plan: _plan, ...rest } = validInput;
      const result = OrganizationPlanLimitSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing feature', () => {
      const { feature: _feature, ...rest } = validInput;
      const result = OrganizationPlanLimitSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing limit_value', () => {
      const { limit_value: _limit_value, ...rest } = validInput;
      const result = OrganizationPlanLimitSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should accept "trial" plan', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, plan: 'trial' });
      expect(result.success).toBe(true);
    });

    it('should accept "advance" plan', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, plan: 'advance' });
      expect(result.success).toBe(true);
    });

    it('should accept "pro" plan', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, plan: 'pro' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid plan', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, plan: 'enterprise' });
      expect(result.success).toBe(false);
    });

    it('should accept "beneficiaries" feature', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, feature: 'beneficiaries' });
      expect(result.success).toBe(true);
    });

    it('should accept "push_notifications_monthly" feature', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, feature: 'push_notifications_monthly' });
      expect(result.success).toBe(true);
    });

    it('should accept "cashiers" feature', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, feature: 'cashiers' });
      expect(result.success).toBe(true);
    });

    it('should accept "branches" feature', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, feature: 'branches' });
      expect(result.success).toBe(true);
    });

    it('should accept "collaborators" feature', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, feature: 'collaborators' });
      expect(result.success).toBe(true);
    });

    it('should accept "redeemable_products" feature', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, feature: 'redeemable_products' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid feature', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, feature: 'invalid_feature' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string limit_value to number', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, limit_value: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(50);
      }
    });

    it('should keep number limit_value as-is', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, limit_value: 200 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(200);
      }
    });

    it('should reject negative limit_value', () => {
      expect(() => OrganizationPlanLimitSchema.parse({ ...validInput, limit_value: -1 })).toThrow();
    });

    it('should reject non-numeric string limit_value', () => {
      expect(() => OrganizationPlanLimitSchema.parse({ ...validInput, limit_value: 'abc' })).toThrow();
    });

    it('should transform string warning_threshold to number', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, warning_threshold: '0.75' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warning_threshold).toBe(0.75);
      }
    });

    it('should default non-numeric string warning_threshold to 0.8', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, warning_threshold: 'abc' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warning_threshold).toBe(0.8);
      }
    });
  });

  describe('edge cases', () => {
    it('should default warning_threshold to 0.8 when omitted', () => {
      const result = OrganizationPlanLimitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warning_threshold).toBe(0.8);
      }
    });

    it('should leave id undefined when omitted', () => {
      const result = OrganizationPlanLimitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should accept limit_value of 0', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, limit_value: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(0);
      }
    });

    it('should accept string "0" as limit_value', () => {
      const result = OrganizationPlanLimitSchema.safeParse({ ...validInput, limit_value: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_value).toBe(0);
      }
    });
  });
});
