import type { AppUserInput, AppUser } from '../app_user.schema';
import { AppUserSchema } from '../app_user.schema';

describe('AppUserSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid app user data with all fields', () => {
      const validInput: AppUserInput = {
        id: '1',
        organization_id: 'org-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'securepassword',
        active: true,
      };

      const result = AppUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse valid app user data with minimal fields', () => {
      const validInput: AppUserInput = {
        organization_id: 'org-1',
      };

      const result = AppUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual({
          organization_id: 'org-1',
          active: true, // default value
        });
      }
    });

    it('should parse app user data with null optional fields', () => {
      const validInput: AppUserInput = {
        organization_id: 'org-1',
        first_name: null,
        last_name: null,
        email: null,
        username: null,
        password: null,
        active: false,
      };

      const result = AppUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.first_name).toBeNull();
        expect(result.data.last_name).toBeNull();
        expect(result.data.email).toBeNull();
        expect(result.data.username).toBeNull();
        expect(result.data.password).toBeNull();
      }
    });

    it('should apply default value for active field', () => {
      const validInput: AppUserInput = {
        organization_id: 'org-1',
      };

      const result = AppUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail validation when organization_id is missing', () => {
      const invalidInput = {
        first_name: 'John',
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['organization_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when email is invalid', () => {
      const invalidInput: AppUserInput = {
        organization_id: 'org-1',
        email: 'invalid-email',
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['email']);
        expect(result.error.issues[0].code).toBe('invalid_format');
      }
    });

    it('should fail validation when organization_id is not a string', () => {
      const invalidInput = {
        organization_id: 123,
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['organization_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when active is not a boolean', () => {
      const invalidInput = {
        organization_id: 'org-1',
        active: 'true',
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['active']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when id is not a string', () => {
      const invalidInput = {
        id: 123,
        organization_id: 'org-1',
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when first_name is not a string or null', () => {
      const invalidInput = {
        organization_id: 'org-1',
        first_name: 123,
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['first_name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when last_name is not a string or null', () => {
      const invalidInput = {
        organization_id: 'org-1',
        last_name: 123,
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['last_name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when username is not a string or null', () => {
      const invalidInput = {
        organization_id: 'org-1',
        username: 123,
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['username']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when password is not a string or null', () => {
      const invalidInput = {
        organization_id: 'org-1',
        password: 123,
      };

      const result = AppUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['password']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = AppUserSchema.safeParse({});
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['organization_id']);
      }
    });

    it('should handle null input', () => {
      const result = AppUserSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = AppUserSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should handle extra fields by ignoring them', () => {
      const inputWithExtra = {
        organization_id: 'org-1',
        extraField: 'should be ignored',
      };

      const result = AppUserSchema.safeParse(inputWithExtra);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
      }
    });
  });

  describe('type exports', () => {
    it('should export AppUserInput type', () => {
      const input: AppUserInput = {
        organization_id: 'org-1',
      };
      expect(input.organization_id).toBe('org-1');
    });

    it('should export AppUser type', () => {
      const appUser: AppUser = {
        organization_id: 'org-1',
        active: true,
      };
      expect(appUser.organization_id).toBe('org-1');
    });
  });
});