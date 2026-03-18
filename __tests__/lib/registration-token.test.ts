import type { PendingRegistration } from '@/lib/registration-token';

const TEST_SECRET = 'super-secret-registration-key-for-testing';

function getModule() {
  return require('@/lib/registration-token') as {
    createRegistrationToken: (data: PendingRegistration) => string;
    verifyRegistrationToken: (token: string) => PendingRegistration | null;
  };
}

describe('registration-token', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, REGISTRATION_SECRET: TEST_SECRET };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const validData: PendingRegistration = {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'securePassword123',
    redirectTo: 'https://example.com/welcome',
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
  };

  describe('createRegistrationToken', () => {
    it('produces a string with a dot separator', () => {
      const { createRegistrationToken } = getModule();
      const token = createRegistrationToken(validData);
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
    });

    it('produces different tokens for the same data (due to random IV)', () => {
      const { createRegistrationToken } = getModule();
      const token1 = createRegistrationToken(validData);
      const token2 = createRegistrationToken(validData);
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyRegistrationToken', () => {
    it('roundtrip: create then verify returns original data', () => {
      const { createRegistrationToken, verifyRegistrationToken } = getModule();
      const token = createRegistrationToken(validData);
      const result = verifyRegistrationToken(token);
      expect(result).toEqual(validData);
    });

    it('returns null for expired token', () => {
      const { createRegistrationToken, verifyRegistrationToken } = getModule();
      const expiredData: PendingRegistration = {
        ...validData,
        expiresAt: Date.now() - 1000, // already expired
      };
      const token = createRegistrationToken(expiredData);
      const result = verifyRegistrationToken(token);
      expect(result).toBeNull();
    });

    it('returns null for tampered token (modified combined part)', () => {
      const { createRegistrationToken, verifyRegistrationToken } = getModule();
      const token = createRegistrationToken(validData);
      const [combined, hmac] = token.split('.');
      // Tamper with the combined part
      const tampered = 'A' + combined.slice(1) + '.' + hmac;
      const result = verifyRegistrationToken(tampered);
      expect(result).toBeNull();
    });

    it('returns null for tampered token (modified HMAC)', () => {
      const { createRegistrationToken, verifyRegistrationToken } = getModule();
      const token = createRegistrationToken(validData);
      const dotIndex = token.lastIndexOf('.');
      const tamperedToken = token.slice(0, dotIndex) + '.invalidhmac';
      const result = verifyRegistrationToken(tamperedToken);
      expect(result).toBeNull();
    });

    it('returns null when token has no dot', () => {
      const { verifyRegistrationToken } = getModule();
      const result = verifyRegistrationToken('nodotinthisstring');
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const { verifyRegistrationToken } = getModule();
      expect(verifyRegistrationToken('')).toBeNull();
    });

    it('returns null for completely invalid token', () => {
      const { verifyRegistrationToken } = getModule();
      expect(verifyRegistrationToken('abc.def')).toBeNull();
    });
  });

  describe('missing REGISTRATION_SECRET', () => {
    it('createRegistrationToken throws when secret is not set', () => {
      delete process.env.REGISTRATION_SECRET;
      jest.resetModules();
      const { createRegistrationToken } = getModule();
      expect(() => createRegistrationToken(validData)).toThrow(
        'REGISTRATION_SECRET is not set in environment variables.'
      );
    });

    it('verifyRegistrationToken returns null when secret is not set (caught by try-catch)', () => {
      // First create a token with valid secret
      const { createRegistrationToken } = getModule();
      const token = createRegistrationToken(validData);

      // Now remove the secret and try to verify
      delete process.env.REGISTRATION_SECRET;
      jest.resetModules();
      const { verifyRegistrationToken } = getModule();
      // The internal try-catch catches the getKey() error and returns null
      expect(verifyRegistrationToken(token)).toBeNull();
    });
  });

  describe('different secrets produce incompatible tokens', () => {
    it('token from one secret cannot be verified with another', () => {
      const { createRegistrationToken } = getModule();
      const token = createRegistrationToken(validData);

      // Change secret
      process.env.REGISTRATION_SECRET = 'different-secret-key-for-testing';
      jest.resetModules();
      const mod2 = getModule();
      const result = mod2.verifyRegistrationToken(token);
      expect(result).toBeNull();
    });
  });
});
