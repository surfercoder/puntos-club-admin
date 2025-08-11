import { AddressSchema, AddressInput, Address } from '../address.schema';

describe('AddressSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid address data with all fields', () => {
      const validInput: AddressInput = {
        id: '1',
        city: 'New York',
        number: '123',
        state: 'NY',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse valid address data without optional id', () => {
      const validInput: AddressInput = {
        city: 'Los Angeles',
        number: '456',
        state: 'CA',
        street: 'Hollywood Blvd',
        zip_code: '90210',
      };

      const result = AddressSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail validation when city is missing', () => {
      const invalidInput = {
        number: '123',
        state: 'NY',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['city']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when city is empty string', () => {
      const invalidInput: AddressInput = {
        city: '',
        number: '123',
        state: 'NY',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['city']);
        expect(result.error.issues[0].message).toBe('City is required');
      }
    });

    it('should fail validation when number is missing', () => {
      const invalidInput = {
        city: 'New York',
        state: 'NY',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['number']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when number is empty string', () => {
      const invalidInput: AddressInput = {
        city: 'New York',
        number: '',
        state: 'NY',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['number']);
        expect(result.error.issues[0].message).toBe('Number is required');
      }
    });

    it('should fail validation when state is missing', () => {
      const invalidInput = {
        city: 'New York',
        number: '123',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['state']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when state is empty string', () => {
      const invalidInput: AddressInput = {
        city: 'New York',
        number: '123',
        state: '',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['state']);
        expect(result.error.issues[0].message).toBe('State is required');
      }
    });

    it('should fail validation when street is missing', () => {
      const invalidInput = {
        city: 'New York',
        number: '123',
        state: 'NY',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['street']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when street is empty string', () => {
      const invalidInput: AddressInput = {
        city: 'New York',
        number: '123',
        state: 'NY',
        street: '',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['street']);
        expect(result.error.issues[0].message).toBe('Street is required');
      }
    });

    it('should fail validation when zip_code is missing', () => {
      const invalidInput = {
        city: 'New York',
        number: '123',
        state: 'NY',
        street: 'Main Street',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['zip_code']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when zip_code is empty string', () => {
      const invalidInput: AddressInput = {
        city: 'New York',
        number: '123',
        state: 'NY',
        street: 'Main Street',
        zip_code: '',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['zip_code']);
        expect(result.error.issues[0].message).toBe('Zip code is required');
      }
    });

    it('should fail validation when multiple fields are invalid', () => {
      const invalidInput = {
        city: '',
        number: '',
        state: '',
        street: '',
        zip_code: '',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(5);
        const paths = result.error.issues.map(issue => issue.path[0]);
        expect(paths).toContain('city');
        expect(paths).toContain('number');
        expect(paths).toContain('state');
        expect(paths).toContain('street');
        expect(paths).toContain('zip_code');
      }
    });

    it('should fail validation when id is not a string', () => {
      const invalidInput = {
        id: 123,
        city: 'New York',
        number: '123',
        state: 'NY',
        street: 'Main Street',
        zip_code: '10001',
      };

      const result = AddressSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = AddressSchema.safeParse({});
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(5);
      }
    });

    it('should handle null input', () => {
      const result = AddressSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = AddressSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should handle extra fields by ignoring them', () => {
      const inputWithExtra = {
        city: 'New York',
        number: '123',
        state: 'NY',
        street: 'Main Street',
        zip_code: '10001',
        extraField: 'should be ignored',
      };

      const result = AddressSchema.safeParse(inputWithExtra);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
      }
    });
  });

  describe('type exports', () => {
    it('should export AddressInput type', () => {
      const input: AddressInput = {
        city: 'Test',
        number: '123',
        state: 'TS',
        street: 'Test St',
        zip_code: '12345',
      };
      expect(input.city).toBe('Test');
    });

    it('should export Address type', () => {
      const address: Address = {
        city: 'Test',
        number: '123',
        state: 'TS',
        street: 'Test St',
        zip_code: '12345',
      };
      expect(address.city).toBe('Test');
    });
  });
});