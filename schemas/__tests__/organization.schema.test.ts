import { OrganizationSchema, OrganizationInput, Organization } from '../organization.schema';

describe('OrganizationSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid organization data with all fields', () => {
      const validInput: OrganizationInput = {
        id: '1',
        name: 'Test Organization',
        business_name: 'Test Business Inc.',
        tax_id: '123456789',
        creation_date: '2023-01-01T00:00:00Z',
      };

      const result = OrganizationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse valid organization data with minimal fields', () => {
      const validInput: OrganizationInput = {
        name: 'Test Organization',
      };

      const result = OrganizationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual({
          name: 'Test Organization',
        });
      }
    });

    it('should parse organization data with null optional fields', () => {
      const validInput: OrganizationInput = {
        name: 'Test Organization',
        business_name: null,
        tax_id: null,
      };

      const result = OrganizationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.business_name).toBeNull();
        expect(result.data.tax_id).toBeNull();
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail validation when name is missing', () => {
      const invalidInput = {
        business_name: 'Test Business Inc.',
      };

      const result = OrganizationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when name is empty string', () => {
      const invalidInput: OrganizationInput = {
        name: '',
      };

      const result = OrganizationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should fail validation when name is not a string', () => {
      const invalidInput = {
        name: 123,
      };

      const result = OrganizationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when business_name is not a string or null', () => {
      const invalidInput = {
        name: 'Test Organization',
        business_name: 123,
      };

      const result = OrganizationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['business_name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when tax_id is not a string or null', () => {
      const invalidInput = {
        name: 'Test Organization',
        tax_id: 123,
      };

      const result = OrganizationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['tax_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when creation_date is not a string', () => {
      const invalidInput = {
        name: 'Test Organization',
        creation_date: new Date(),
      };

      const result = OrganizationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['creation_date']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when id is not a string', () => {
      const invalidInput = {
        id: 123,
        name: 'Test Organization',
      };

      const result = OrganizationSchema.safeParse(invalidInput);
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
      const result = OrganizationSchema.safeParse({});
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
      }
    });

    it('should handle null input', () => {
      const result = OrganizationSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = OrganizationSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should handle extra fields by ignoring them', () => {
      const inputWithExtra = {
        name: 'Test Organization',
        extraField: 'should be ignored',
      };

      const result = OrganizationSchema.safeParse(inputWithExtra);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
      }
    });
  });

  describe('type exports', () => {
    it('should export OrganizationInput type', () => {
      const input: OrganizationInput = {
        name: 'Test',
      };
      expect(input.name).toBe('Test');
    });

    it('should export Organization type', () => {
      const organization: Organization = {
        name: 'Test',
      };
      expect(organization.name).toBe('Test');
    });
  });
});