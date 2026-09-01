import { AppUserSchema } from '@/schemas/app_user.schema';

describe('AppUserSchema', () => {
  const validAppUser = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    password: 'Passw0rd!',
  };

  describe('valid input', () => {
    it('should accept a complete new user', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, role_id: 'role-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBe('John');
      }
    });

    it('should accept an edit without password', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, id: 'user-1', password: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBeUndefined();
      }
    });
  });

  describe('required fields', () => {
    it.each(['first_name', 'last_name', 'email', 'password'])('should reject empty %s', (field) => {
      const result = AppUserSchema.safeParse({ ...validAppUser, [field]: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
      }
    });

    it('should reject a missing field', () => {
      const { email: _email, ...withoutEmail } = validAppUser;
      expect(AppUserSchema.safeParse(withoutEmail).success).toBe(false);
    });

    it('should reject invalid email format', () => {
      expect(AppUserSchema.safeParse({ ...validAppUser, email: 'not-an-email' }).success).toBe(false);
    });

    it('should reject a weak password', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, password: 'weak' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === 'password')).toBe(true);
      }
    });

    it('should reject a weak password on edit too', () => {
      expect(
        AppUserSchema.safeParse({ ...validAppUser, id: 'user-1', password: 'weak' }).success,
      ).toBe(false);
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
  });
});
