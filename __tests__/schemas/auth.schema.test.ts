import {
  LoginSchema,
  SignUpSchema,
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

describe('SignUpSchema', () => {
  const validSignUp = {
    email: 'test@example.com',
    password: 'secret123',
    repeatPassword: 'secret123',
  };

  describe('valid input', () => {
    it('should accept valid signup data', () => {
      const result = SignUpSchema.safeParse(validSignUp);
      expect(result.success).toBe(true);
    });

    it('should accept optional firstName and lastName', () => {
      const result = SignUpSchema.safeParse({
        ...validSignUp,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty string for firstName and lastName', () => {
      const result = SignUpSchema.safeParse({
        ...validSignUp,
        firstName: '',
        lastName: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should reject missing email', () => {
      const result = SignUpSchema.safeParse({ password: 'secret123', repeatPassword: 'secret123' });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = SignUpSchema.safeParse({ email: 'test@example.com', repeatPassword: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should reject missing repeatPassword', () => {
      const result = SignUpSchema.safeParse({ email: 'test@example.com', password: 'secret123' });
      expect(result.success).toBe(false);
    });
  });

  describe('refine logic', () => {
    it('should reject when passwords do not match', () => {
      const result = SignUpSchema.safeParse({
        ...validSignUp,
        repeatPassword: 'different',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const repeatPasswordError = result.error.issues.find(
          (i) => i.path.includes('repeatPassword')
        );
        expect(repeatPasswordError).toBeDefined();
        expect(repeatPasswordError?.message).toBe('Las contraseñas no coinciden');
      }
    });

    it('should accept when passwords match', () => {
      const result = SignUpSchema.safeParse(validSignUp);
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should reject password shorter than 6 characters', () => {
      const result = SignUpSchema.safeParse({
        ...validSignUp,
        password: '12345',
        repeatPassword: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty repeatPassword', () => {
      const result = SignUpSchema.safeParse({
        ...validSignUp,
        repeatPassword: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = SignUpSchema.safeParse({
        ...validSignUp,
        email: 'bad-email',
      });
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
