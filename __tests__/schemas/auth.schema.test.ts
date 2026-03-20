import {
  LoginSchema,
  ProfileSchema,
  ForgotPasswordSchema,
  UpdatePasswordSchema,
} from '@/schemas/auth.schema';

describe('LoginSchema', () => {
  describe('valid input', () => {
    it('should accept valid email and password', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com', password: 'secret' });
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should reject missing email', () => {
      const result = LoginSchema.safeParse({ password: 'secret' });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should reject empty email', () => {
      const result = LoginSchema.safeParse({ email: '', password: 'secret' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = LoginSchema.safeParse({ email: 'not-email', password: 'secret' });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = LoginSchema.safeParse({ email: 'test@example.com', password: '' });
      expect(result.success).toBe(false);
    });
  });
});

describe('ProfileSchema', () => {
  const validProfile = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  };

  describe('valid input', () => {
    it('should accept valid profile data', () => {
      const result = ProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should accept optional username', () => {
      const result = ProfileSchema.safeParse({ ...validProfile, username: 'johndoe' });
      expect(result.success).toBe(true);
    });

    it('should accept empty username', () => {
      const result = ProfileSchema.safeParse({ ...validProfile, username: '' });
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should reject missing first_name', () => {
      const { first_name: _first_name, ...rest } = validProfile;
      const result = ProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing last_name', () => {
      const { last_name: _last_name, ...rest } = validProfile;
      const result = ProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const { email: _email, ...rest } = validProfile;
      const result = ProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should reject empty first_name', () => {
      const result = ProfileSchema.safeParse({ ...validProfile, first_name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty last_name', () => {
      const result = ProfileSchema.safeParse({ ...validProfile, last_name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = ProfileSchema.safeParse({ ...validProfile, email: 'bad' });
      expect(result.success).toBe(false);
    });
  });
});

describe('ForgotPasswordSchema', () => {
  it('should accept valid email', () => {
    const result = ForgotPasswordSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('should reject missing email', () => {
    const result = ForgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty email', () => {
    const result = ForgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = ForgotPasswordSchema.safeParse({ email: 'not-email' });
    expect(result.success).toBe(false);
  });
});

describe('UpdatePasswordSchema', () => {
  it('should accept valid password', () => {
    const result = UpdatePasswordSchema.safeParse({ password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('should reject missing password', () => {
    const result = UpdatePasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 characters', () => {
    const result = UpdatePasswordSchema.safeParse({ password: '12345' });
    expect(result.success).toBe(false);
  });

  it('should accept password with exactly 6 characters', () => {
    const result = UpdatePasswordSchema.safeParse({ password: '123456' });
    expect(result.success).toBe(true);
  });
});
