import { BranchSchema } from '@/schemas/branch.schema';

describe('BranchSchema', () => {
  const validBranch = {
    address_id: 'addr-1',
    name: 'Main Branch',
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = BranchSchema.safeParse(validBranch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should accept all optional fields', () => {
      const result = BranchSchema.safeParse({
        ...validBranch,
        id: 'branch-1',
        organization_id: 'org-1',
        phone: '+5491112345678',
        active: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing address_id', () => {
      const result = BranchSchema.safeParse({ name: 'Branch' });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = BranchSchema.safeParse({ address_id: 'addr-1' });
      expect(result.success).toBe(false);
    });

    it('should reject empty address_id', () => {
      const result = BranchSchema.safeParse({ ...validBranch, address_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = BranchSchema.safeParse({ ...validBranch, name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should accept string organization_id', () => {
      const result = BranchSchema.safeParse({ ...validBranch, organization_id: 'org-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organization_id).toBe('org-1');
      }
    });

    it('should accept number organization_id', () => {
      const result = BranchSchema.safeParse({ ...validBranch, organization_id: 123 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organization_id).toBe(123);
      }
    });

    it('should transform string "true" to boolean true for active', () => {
      const result = BranchSchema.safeParse({ ...validBranch, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for active', () => {
      const result = BranchSchema.safeParse({ ...validBranch, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should transform boolean true to true for active', () => {
      const result = BranchSchema.safeParse({ ...validBranch, active: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should transform boolean false to false for active', () => {
      const result = BranchSchema.safeParse({ ...validBranch, active: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should transform arbitrary string to false for active', () => {
      const result = BranchSchema.safeParse({ ...validBranch, active: 'anything' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should default active to true when omitted', () => {
      const result = BranchSchema.safeParse(validBranch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should accept null for phone', () => {
      const result = BranchSchema.safeParse({ ...validBranch, phone: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBeNull();
      }
    });

    it('should accept string phone', () => {
      const result = BranchSchema.safeParse({ ...validBranch, phone: '123456' });
      expect(result.success).toBe(true);
    });
  });
});
