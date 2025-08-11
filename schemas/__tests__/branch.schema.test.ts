import { BranchSchema, BranchInput, Branch } from '../branch.schema';

describe('BranchSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid branch data with all fields', () => {
      const validInput: BranchInput = {
        id: '1',
        organization_id: 'org-1',
        address_id: 'addr-1',
        name: 'Main Branch',
        code: 'MB001',
        phone: '+1234567890',
        active: true,
      };

      const result = BranchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse valid branch data with minimal fields', () => {
      const validInput: BranchInput = {
        organization_id: 'org-1',
        name: 'Main Branch',
      };

      const result = BranchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual({
          organization_id: 'org-1',
          name: 'Main Branch',
          active: true, // default value
        });
      }
    });

    it('should parse branch data with null optional fields', () => {
      const validInput: BranchInput = {
        organization_id: 'org-1',
        address_id: null,
        name: 'Branch',
        code: null,
        phone: null,
        active: false,
      };

      const result = BranchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.address_id).toBeNull();
        expect(result.data.code).toBeNull();
        expect(result.data.phone).toBeNull();
      }
    });

    it('should apply default value for active field', () => {
      const validInput: BranchInput = {
        organization_id: 'org-1',
        name: 'Test Branch',
      };

      const result = BranchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail validation when organization_id is missing', () => {
      const invalidInput = {
        name: 'Test Branch',
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['organization_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when name is missing', () => {
      const invalidInput = {
        organization_id: 'org-1',
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when name is empty string', () => {
      const invalidInput: BranchInput = {
        organization_id: 'org-1',
        name: '',
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should fail validation when organization_id is not a string', () => {
      const invalidInput = {
        organization_id: 123,
        name: 'Test Branch',
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['organization_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when name is not a string', () => {
      const invalidInput = {
        organization_id: 'org-1',
        name: 123,
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when active is not a boolean', () => {
      const invalidInput = {
        organization_id: 'org-1',
        name: 'Test Branch',
        active: 'true',
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['active']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when address_id is not a string or null', () => {
      const invalidInput = {
        organization_id: 'org-1',
        name: 'Test Branch',
        address_id: 123,
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['address_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when code is not a string or null', () => {
      const invalidInput = {
        organization_id: 'org-1',
        name: 'Test Branch',
        code: 123,
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['code']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should fail validation when phone is not a string or null', () => {
      const invalidInput = {
        organization_id: 'org-1',
        name: 'Test Branch',
        phone: 123,
      };

      const result = BranchSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['phone']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = BranchSchema.safeParse({});
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
        const paths = result.error.issues.map(issue => issue.path[0]);
        expect(paths).toContain('organization_id');
        expect(paths).toContain('name');
      }
    });

    it('should handle null input', () => {
      const result = BranchSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = BranchSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should handle extra fields by ignoring them', () => {
      const inputWithExtra = {
        organization_id: 'org-1',
        name: 'Test Branch',
        extraField: 'should be ignored',
      };

      const result = BranchSchema.safeParse(inputWithExtra);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
      }
    });
  });

  describe('type exports', () => {
    it('should export BranchInput type', () => {
      const input: BranchInput = {
        organization_id: 'org-1',
        name: 'Test',
      };
      expect(input.name).toBe('Test');
    });

    it('should export Branch type', () => {
      const branch: Branch = {
        organization_id: 'org-1',
        name: 'Test',
        active: true,
      };
      expect(branch.name).toBe('Test');
    });
  });
});