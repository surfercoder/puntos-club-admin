import { PushTokenSchema } from '@/schemas/push_token.schema';

describe('PushTokenSchema', () => {
  const validInput = {
    beneficiary_id: 'ben-1',
    expo_push_token: 'ExponentPushToken[abc123]',
  };

  describe('valid input', () => {
    it('should accept minimal valid input with defaults', () => {
      const result = PushTokenSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should accept all optional fields', () => {
      const result = PushTokenSchema.safeParse({
        ...validInput,
        id: 'token-1',
        device_id: 'device-abc',
        platform: 'ios',
        is_active: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-15',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe('ios');
        expect(result.data.is_active).toBe(false);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing beneficiary_id', () => {
      const result = PushTokenSchema.safeParse({ expo_push_token: 'token' });
      expect(result.success).toBe(false);
    });

    it('should reject missing expo_push_token', () => {
      const result = PushTokenSchema.safeParse({ beneficiary_id: 'ben-1' });
      expect(result.success).toBe(false);
    });

    it('should reject empty beneficiary_id', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, beneficiary_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty expo_push_token', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, expo_push_token: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should accept "ios" platform', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, platform: 'ios' });
      expect(result.success).toBe(true);
    });

    it('should accept "android" platform', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, platform: 'android' });
      expect(result.success).toBe(true);
    });

    it('should accept "web" platform', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, platform: 'web' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid platform', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, platform: 'windows' });
      expect(result.success).toBe(false);
    });

    it('should accept null for platform', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, platform: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBeNull();
      }
    });
  });

  describe('type transforms', () => {
    it('should transform string "true" to boolean true for is_active', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, is_active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should transform string "on" to boolean true for is_active', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, is_active: 'on' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for is_active', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, is_active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(false);
      }
    });

    it('should keep boolean values for is_active', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, is_active: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(false);
      }
    });

    it('should default is_active to true when omitted', () => {
      const result = PushTokenSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should accept null for device_id', () => {
      const result = PushTokenSchema.safeParse({ ...validInput, device_id: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.device_id).toBeNull();
      }
    });
  });
});
