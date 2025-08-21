import type { BeneficiaryInput, Beneficiary } from '../beneficiary.schema';
import { BeneficiarySchema } from '../beneficiary.schema';

describe('BeneficiarySchema', () => {
  describe('valid inputs', () => {
    it('should parse valid beneficiary data with all fields', () => {
      const validInput: BeneficiaryInput = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        document_id: 'DOC123456',
        available_points: 100,
        registration_date: '2023-01-01T00:00:00Z',
      };

      const result = BeneficiarySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse valid beneficiary data with minimal fields', () => {
      const validInput = {};

      const result = BeneficiarySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.available_points).toBe(0); // default value
      }
    });

    it('should preprocess string available_points to number', () => {
      const validInput = {
        available_points: '150',
      };

      const result = BeneficiarySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.available_points).toBe(150);
        expect(typeof result.data.available_points).toBe('number');
      }
    });

    it('should handle invalid string available_points by defaulting to 0', () => {
      const validInput = {
        available_points: 'invalid',
      };

      const result = BeneficiarySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.available_points).toBe(0);
      }
    });

    it('should parse beneficiary data with null optional fields', () => {
      const validInput: BeneficiaryInput = {
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        document_id: null,
        available_points: 0,
      };

      const result = BeneficiarySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.first_name).toBeNull();
        expect(result.data.last_name).toBeNull();
        expect(result.data.email).toBeNull();
        expect(result.data.phone).toBeNull();
        expect(result.data.document_id).toBeNull();
      }
    });

    it('should apply default value for available_points', () => {
      const validInput = {};

      const result = BeneficiarySchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.available_points).toBe(0);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail validation when email is invalid', () => {
      const invalidInput = {
        email: 'invalid-email',
      };

      const result = BeneficiarySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['email']);
        expect(result.error.issues[0].code).toBe('invalid_format');
      }
    });

    it('should fail validation when available_points is negative', () => {
      const invalidInput = {
        available_points: -10,
      };

      const result = BeneficiarySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['available_points']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should fail validation when available_points is not an integer', () => {
      const invalidInput = {
        available_points: 10.5,
      };

      const result = BeneficiarySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['available_points']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when first_name is not a string or null', () => {
      const invalidInput = {
        first_name: 123,
      };

      const result = BeneficiarySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['first_name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('preprocessing', () => {
    it('should preprocess valid numeric string to number', () => {
      const input = { available_points: '42' };
      const result = BeneficiarySchema.safeParse(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available_points).toBe(42);
      }
    });

    it('should preprocess negative numeric string to number (which then fails validation)', () => {
      const input = { available_points: '-5' };
      const result = BeneficiarySchema.safeParse(input);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should handle empty string by converting to 0', () => {
      const input = { available_points: '' };
      const result = BeneficiarySchema.safeParse(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available_points).toBe(0);
      }
    });
  });

  describe('type exports', () => {
    it('should export BeneficiaryInput type', () => {
      const input: BeneficiaryInput = {
        first_name: 'Test',
      };
      expect(input.first_name).toBe('Test');
    });

    it('should export Beneficiary type', () => {
      const beneficiary: Beneficiary = {
        available_points: 0,
      };
      expect(beneficiary.available_points).toBe(0);
    });
  });
});