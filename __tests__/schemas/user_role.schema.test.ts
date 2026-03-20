import { UserRoleSchema } from '@/schemas/user_role.schema';

describe('UserRoleSchema', () => {
  const validInput = {
    name: 'owner',
    display_name: 'Owner',
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = UserRoleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('owner');
        expect(result.data.display_name).toBe('Owner');
      }
    });

    it('should accept all fields', () => {
      const result = UserRoleSchema.safeParse({
        ...validInput,
        id: 'role-1',
        description: 'Full access to the organization',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('role-1');
        expect(result.data.description).toBe('Full access to the organization');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing name', () => {
      const { name: _name, ...rest } = validInput;
      const result = UserRoleSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing display_name', () => {
      const { display_name: _display_name, ...rest } = validInput;
      const result = UserRoleSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty display_name', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, display_name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('should accept "final_user" name', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, name: 'final_user' });
      expect(result.success).toBe(true);
    });

    it('should accept "cashier" name', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, name: 'cashier' });
      expect(result.success).toBe(true);
    });

    it('should accept "owner" name', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, name: 'owner' });
      expect(result.success).toBe(true);
    });

    it('should accept "collaborator" name', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, name: 'collaborator' });
      expect(result.success).toBe(true);
    });

    it('should accept "admin" name', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, name: 'admin' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid name', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, name: 'superadmin' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform empty description to null', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, description: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it('should keep valid description string', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, description: 'A role description' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('A role description');
      }
    });

    it('should accept null description', () => {
      const result = UserRoleSchema.safeParse({ ...validInput, description: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });
  });

  describe('edge cases', () => {
    it('should leave id undefined when omitted', () => {
      const result = UserRoleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should leave description undefined when omitted', () => {
      const result = UserRoleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should reject empty object', () => {
      const result = UserRoleSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
