import { SubscriptionSchema } from '@/schemas/subscription.schema';

describe('SubscriptionSchema', () => {
  const validInput = {
    organization_id: 'org-1',
    mp_preapproval_id: 'preapproval-123',
    mp_plan_id: 'plan-456',
    plan: 'advance',
    payer_email: 'test@example.com',
    amount: 5000,
  };

  describe('valid input', () => {
    it('should accept minimal valid input with defaults', () => {
      const result = SubscriptionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organization_id).toBe('org-1');
        expect(result.data.mp_preapproval_id).toBe('preapproval-123');
        expect(result.data.mp_plan_id).toBe('plan-456');
        expect(result.data.plan).toBe('advance');
        expect(result.data.status).toBe('pending');
        expect(result.data.payer_email).toBe('test@example.com');
        expect(result.data.amount).toBe(5000);
        expect(result.data.currency).toBe('ARS');
      }
    });

    it('should accept all fields', () => {
      const result = SubscriptionSchema.safeParse({
        ...validInput,
        id: 'sub-1',
        status: 'authorized',
        currency: 'USD',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('sub-1');
        expect(result.data.status).toBe('authorized');
        expect(result.data.currency).toBe('USD');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing organization_id', () => {
      const { organization_id: _organization_id, ...rest } = validInput;
      const result = SubscriptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty organization_id', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, organization_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing mp_preapproval_id', () => {
      const { mp_preapproval_id: _mp_preapproval_id, ...rest } = validInput;
      const result = SubscriptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty mp_preapproval_id', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, mp_preapproval_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing mp_plan_id', () => {
      const { mp_plan_id: _mp_plan_id, ...rest } = validInput;
      const result = SubscriptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty mp_plan_id', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, mp_plan_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing plan', () => {
      const { plan: _plan, ...rest } = validInput;
      const result = SubscriptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing payer_email', () => {
      const { payer_email: _payer_email, ...rest } = validInput;
      const result = SubscriptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing amount', () => {
      const { amount: _amount, ...rest } = validInput;
      const result = SubscriptionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should accept "advance" plan', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, plan: 'advance' });
      expect(result.success).toBe(true);
    });

    it('should accept "pro" plan', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, plan: 'pro' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid plan', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, plan: 'trial' });
      expect(result.success).toBe(false);
    });

    it('should accept "pending" status', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, status: 'pending' });
      expect(result.success).toBe(true);
    });

    it('should accept "authorized" status', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, status: 'authorized' });
      expect(result.success).toBe(true);
    });

    it('should accept "paused" status', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, status: 'paused' });
      expect(result.success).toBe(true);
    });

    it('should accept "cancelled" status', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, status: 'cancelled' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, status: 'active' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string amount to number', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, amount: '9999.99' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(9999.99);
      }
    });

    it('should keep number amount as-is', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, amount: 3000 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(3000);
      }
    });

    it('should reject non-numeric string amount', () => {
      expect(() => SubscriptionSchema.parse({ ...validInput, amount: 'abc' })).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should default status to "pending" when omitted', () => {
      const result = SubscriptionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('pending');
      }
    });

    it('should default currency to "ARS" when omitted', () => {
      const result = SubscriptionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('ARS');
      }
    });

    it('should leave id undefined when omitted', () => {
      const result = SubscriptionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should reject invalid email format', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, payer_email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject empty payer_email', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, payer_email: '' });
      expect(result.success).toBe(false);
    });

    it('should accept amount of 0', () => {
      const result = SubscriptionSchema.safeParse({ ...validInput, amount: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(0);
      }
    });
  });
});
