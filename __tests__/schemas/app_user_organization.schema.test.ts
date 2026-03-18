import { AppUserOrganizationSchema } from '@/schemas/app_user_organization.schema';

describe('AppUserOrganizationSchema', () => {
  const validInput = {
    app_user_id: 'user-1',
    organization_id: 'org-1',
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = AppUserOrganizationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should accept all optional fields', () => {
      const result = AppUserOrganizationSchema.safeParse({
        ...validInput,
        id: 'id-1',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(false);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing app_user_id', () => {
      const result = AppUserOrganizationSchema.safeParse({ organization_id: 'org-1' });
      expect(result.success).toBe(false);
    });

    it('should reject missing organization_id', () => {
      const result = AppUserOrganizationSchema.safeParse({ app_user_id: 'user-1' });
      expect(result.success).toBe(false);
    });

    it('should reject empty app_user_id', () => {
      const result = AppUserOrganizationSchema.safeParse({ ...validInput, app_user_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty organization_id', () => {
      const result = AppUserOrganizationSchema.safeParse({ ...validInput, organization_id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string "true" to boolean true for is_active', () => {
      const result = AppUserOrganizationSchema.safeParse({ ...validInput, is_active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should transform string "on" to boolean true for is_active', () => {
      const result = AppUserOrganizationSchema.safeParse({ ...validInput, is_active: 'on' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for is_active', () => {
      const result = AppUserOrganizationSchema.safeParse({ ...validInput, is_active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(false);
      }
    });

    it('should keep boolean values as-is for is_active', () => {
      const resultTrue = AppUserOrganizationSchema.safeParse({ ...validInput, is_active: true });
      const resultFalse = AppUserOrganizationSchema.safeParse({ ...validInput, is_active: false });
      expect(resultTrue.success).toBe(true);
      expect(resultFalse.success).toBe(true);
      if (resultTrue.success) expect(resultTrue.data.is_active).toBe(true);
      if (resultFalse.success) expect(resultFalse.data.is_active).toBe(false);
    });

    it('should default is_active to true when omitted', () => {
      const result = AppUserOrganizationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should accept optional date strings', () => {
      const result = AppUserOrganizationSchema.safeParse({
        ...validInput,
        created_at: '2024-01-01',
        updated_at: '2024-06-15',
      });
      expect(result.success).toBe(true);
    });
  });
});
