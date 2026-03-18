import { OrganizationNotificationLimitSchema } from '@/schemas/organization_notification_limit.schema';

describe('OrganizationNotificationLimitSchema', () => {
  const validInput = {
    organization_id: 'org-1',
  };

  describe('valid input', () => {
    it('should accept minimal valid input with defaults', () => {
      const result = OrganizationNotificationLimitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan_type).toBe('free');
        expect(result.data.daily_limit).toBe(1);
        expect(result.data.monthly_limit).toBe(5);
        expect(result.data.min_hours_between_notifications).toBe(24);
        expect(result.data.notifications_sent_today).toBe(0);
        expect(result.data.notifications_sent_this_month).toBe(0);
      }
    });

    it('should accept all fields', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({
        ...validInput,
        id: 'limit-1',
        plan_type: 'premium',
        daily_limit: 100,
        monthly_limit: 1000,
        min_hours_between_notifications: 1,
        notifications_sent_today: 5,
        notifications_sent_this_month: 50,
        last_notification_sent_at: '2024-01-01T12:00:00Z',
        reset_daily_at: '2024-01-02T00:00:00Z',
        reset_monthly_at: '2024-02-01T00:00:00Z',
        created_at: '2024-01-01',
        updated_at: '2024-01-15',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan_type).toBe('premium');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing organization_id', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty organization_id', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ organization_id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should accept "free" plan_type', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, plan_type: 'free' });
      expect(result.success).toBe(true);
    });

    it('should accept "light" plan_type', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, plan_type: 'light' });
      expect(result.success).toBe(true);
    });

    it('should accept "pro" plan_type', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, plan_type: 'pro' });
      expect(result.success).toBe(true);
    });

    it('should accept "premium" plan_type', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, plan_type: 'premium' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid plan_type', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, plan_type: 'enterprise' });
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should reject daily_limit less than 1', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, daily_limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject monthly_limit less than 1', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, monthly_limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject min_hours_between_notifications less than 1', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, min_hours_between_notifications: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative notifications_sent_today', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, notifications_sent_today: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject negative notifications_sent_this_month', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, notifications_sent_this_month: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer daily_limit', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, daily_limit: 1.5 });
      expect(result.success).toBe(false);
    });

    it('should accept null for last_notification_sent_at', () => {
      const result = OrganizationNotificationLimitSchema.safeParse({ ...validInput, last_notification_sent_at: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.last_notification_sent_at).toBeNull();
      }
    });
  });
});
