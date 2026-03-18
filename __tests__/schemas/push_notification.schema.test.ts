import { PushNotificationSchema } from '@/schemas/push_notification.schema';

describe('PushNotificationSchema', () => {
  const validInput = {
    organization_id: 'org-1',
    created_by: 'user-1',
    title: 'New Promo',
    body: 'Check out our latest deals!',
  };

  describe('valid input', () => {
    it('should accept minimal valid input with defaults', () => {
      const result = PushNotificationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sent_count).toBe(0);
        expect(result.data.failed_count).toBe(0);
        expect(result.data.status).toBe('draft');
      }
    });

    it('should accept all optional fields', () => {
      const result = PushNotificationSchema.safeParse({
        ...validInput,
        id: 'notif-1',
        data: { key: 'value' },
        sent_count: 10,
        failed_count: 2,
        status: 'sent',
        sent_at: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should reject missing organization_id', () => {
      const { organization_id: _organization_id, ...rest } = validInput;
      const result = PushNotificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing created_by', () => {
      const { created_by: _created_by, ...rest } = validInput;
      const result = PushNotificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing title', () => {
      const { title: _title, ...rest } = validInput;
      const result = PushNotificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing body', () => {
      const { body: _body, ...rest } = validInput;
      const result = PushNotificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty organization_id', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, organization_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty created_by', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, created_by: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty body', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, body: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should accept "draft" status', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, status: 'draft' });
      expect(result.success).toBe(true);
    });

    it('should accept "sending" status', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, status: 'sending' });
      expect(result.success).toBe(true);
    });

    it('should accept "sent" status', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, status: 'sent' });
      expect(result.success).toBe(true);
    });

    it('should accept "failed" status', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, status: 'failed' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, status: 'pending' });
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should accept null for data', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, data: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBeNull();
      }
    });

    it('should accept record object for data', () => {
      const result = PushNotificationSchema.safeParse({
        ...validInput,
        data: { action: 'open_promo', id: 123 },
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative sent_count', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, sent_count: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject negative failed_count', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, failed_count: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept null for sent_at', () => {
      const result = PushNotificationSchema.safeParse({ ...validInput, sent_at: null });
      expect(result.success).toBe(true);
    });
  });
});
