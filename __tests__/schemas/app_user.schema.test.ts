import { AppUserSchema } from '@/schemas/app_user.schema';

describe('AppUserSchema', () => {
  const validAppUser = {};

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = AppUserSchema.safeParse(validAppUser);
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = AppUserSchema.safeParse({
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'secret123',
        role_id: 'role-1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBe('John');
      }
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

    it('should transform empty password to null', () => {
      const result = AppUserSchema.safeParse({ ...validAppUser, password: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBeNull();
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
        expect(result.data.first_name).toBeUndefined();
      }
    });
  });
});
