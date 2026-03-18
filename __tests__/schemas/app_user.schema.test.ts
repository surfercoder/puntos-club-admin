import { AppUserSchema } from '@/schemas/app_user.schema';

describe('AppUserSchema', () => {
  const validAppUser = {
    organization_id: 'org-1',
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = AppUserSchema.safeParse(validAppUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should accept all optional fields', () => {
      const result = AppUserSchema.safeParse({
        ...validAppUser,
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'secret123',
        active: false,
        role_id: 'role-1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBe('John');
        expect(result.data.active).toBe(false);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing organization_id', () => {
      const result = AppUserSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty string for organization_id', () => {
      const result = AppUserSchema.safeParse({ organization_id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform empty first_name to null', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, first_name: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBeNull();
      }
    });

    it('should transform empty last_name to null', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, last_name: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.last_name).toBeNull();
      }
    });

    it('should transform empty email to null', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, email: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeNull();
      }
    });

    it('should reject invalid email format', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should transform empty username to null', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, username: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBeNull();
      }
    });

    it('should transform empty password to null', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, password: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBeNull();
      }
    });

    it('should transform string "true" to boolean true for active', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "on" to boolean true for active', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, active: 'on' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for active', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should transform arbitrary string to boolean false for active', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, active: 'anything' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should keep boolean true as-is for active', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, active: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should keep boolean false as-is for active', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, active: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should default active to true when omitted', () => {
      const result = AppUserSchema.safeParse(validAppUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should accept null for role_id', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, role_id: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role_id).toBeNull();
      }
    });

    it('should accept undefined for role_id', () => {
      const result = AppUserSchema.safeParse(validAppUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role_id).toBeUndefined();
      }
    });

    it('should leave omitted optional fields as undefined', () => {
      const result = AppUserSchema.safeParse(validAppUser);
      expect(result.success).toBe(true);
      if (result.success) {
        // optional fields omitted remain undefined (transform only runs when value is provided)
        expect(result.data.first_name).toBeUndefined();
      }
    });
  });
});
