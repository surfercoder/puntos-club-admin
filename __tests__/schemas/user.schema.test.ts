import { UserSchema } from '@/schemas/user.schema';

describe('UserSchema', () => {
  const validUser = {
    organization_id: 'org-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    active: true,
    role_id: 'role-1',
    user_type: 'beneficiary' as const,
  };

  const validAppUser = {
    ...validUser,
    user_type: 'app_user' as const,
    password: 'secret123',
  };

  describe('valid input', () => {
    it('should accept valid beneficiary user', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should accept valid app_user with password', () => {
      const result = UserSchema.safeParse(validAppUser);
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        id: 'user-1',
        username: 'johndoe',
        password: 'secret123',
        phone: '+5491112345678',
        document_id: 'DNI123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('johndoe');
        expect(result.data.password).toBe('secret123');
        expect(result.data.phone).toBe('+5491112345678');
        expect(result.data.document_id).toBe('DNI123');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing organization_id', () => {
      const { organization_id: _organization_id, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing first_name', () => {
      const { first_name: _first_name, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing last_name', () => {
      const { last_name: _last_name, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const { email: _email, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing role_id', () => {
      const { role_id: _role_id, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing user_type', () => {
      const { user_type: _user_type, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty organization_id', () => {
      const result = UserSchema.safeParse({ ...validUser, organization_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty first_name', () => {
      const result = UserSchema.safeParse({ ...validUser, first_name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty last_name', () => {
      const result = UserSchema.safeParse({ ...validUser, last_name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty role_id', () => {
      const result = UserSchema.safeParse({ ...validUser, role_id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform empty username to null', () => {
      const result = UserSchema.safeParse({ ...validUser, username: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBeNull();
      }
    });

    it('should transform empty password to null', () => {
      const result = UserSchema.safeParse({ ...validUser, password: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBeNull();
      }
    });

    it('should transform empty phone to null', () => {
      const result = UserSchema.safeParse({ ...validUser, phone: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBeNull();
      }
    });

    it('should transform empty document_id to null', () => {
      const result = UserSchema.safeParse({ ...validUser, document_id: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.document_id).toBeNull();
      }
    });

    it('should transform string "true" to boolean true for active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "on" to boolean true for active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'on' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should keep boolean values for active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });
  });

  describe('enum validation', () => {
    it('should accept "app_user" user_type', () => {
      const result = UserSchema.safeParse(validAppUser);
      expect(result.success).toBe(true);
    });

    it('should accept "beneficiary" user_type', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid user_type', () => {
      const result = UserSchema.safeParse({ ...validUser, user_type: 'admin' });
      expect(result.success).toBe(false);
    });
  });

  describe('refine logic', () => {
    it('should reject new app_user without password (no id)', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        user_type: 'app_user',
        // no id, no password
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError).toBeDefined();
        expect(passwordError?.message).toBe('Password is required for new users');
      }
    });

    it('should reject new app_user with empty password (transforms to null)', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        user_type: 'app_user',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError).toBeDefined();
      }
    });

    it('should accept existing app_user without password (has id)', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        id: 'existing-user-id',
        user_type: 'app_user',
        // no password
      });
      expect(result.success).toBe(true);
    });

    it('should accept new beneficiary without password', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        user_type: 'beneficiary',
        // no id, no password
      });
      expect(result.success).toBe(true);
    });

    it('should accept new app_user with valid password', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        user_type: 'app_user',
        password: 'validpass',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should reject invalid email format', () => {
      const result = UserSchema.safeParse({ ...validUser, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject username shorter than 3 characters (non-empty)', () => {
      const result = UserSchema.safeParse({ ...validUser, username: 'ab' });
      expect(result.success).toBe(false);
    });

    it('should accept username with exactly 3 characters', () => {
      const result = UserSchema.safeParse({ ...validUser, username: 'abc' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('abc');
      }
    });

    it('should reject password shorter than 6 characters (non-empty)', () => {
      const result = UserSchema.safeParse({ ...validUser, password: '12345' });
      expect(result.success).toBe(false);
    });

    it('should accept password with exactly 6 characters', () => {
      const result = UserSchema.safeParse({ ...validUser, password: '123456' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('123456');
      }
    });

    it('should leave omitted optional fields as undefined', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBeUndefined();
        expect(result.data.password).toBeUndefined();
        expect(result.data.phone).toBeUndefined();
        expect(result.data.document_id).toBeUndefined();
      }
    });
  });
});
