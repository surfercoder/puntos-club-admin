import { BeneficiaryOrganizationSchema } from '@/schemas/beneficiary_organization.schema';

describe('BeneficiaryOrganizationSchema', () => {
  const validInput = {
    beneficiary_id: 'ben-1',
    organization_id: 'org-1',
  };

  describe('valid input', () => {
    it('should accept minimal valid input with defaults', () => {
      const result = BeneficiaryOrganizationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available_points).toBe(0);
        expect(result.data.total_points_earned).toBe(0);
        expect(result.data.total_points_redeemed).toBe(0);
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should accept all optional fields', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({
        ...validInput,
        id: 'id-1',
        available_points: 100,
        total_points_earned: 200,
        total_points_redeemed: 100,
        joined_date: '2024-01-01',
        is_active: false,
        created_at: '2024-01-01',
        updated_at: '2024-06-01',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should reject missing beneficiary_id', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ organization_id: 'org-1' });
      expect(result.success).toBe(false);
    });

    it('should reject missing organization_id', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ beneficiary_id: 'ben-1' });
      expect(result.success).toBe(false);
    });

    it('should reject empty beneficiary_id', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, beneficiary_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty organization_id', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, organization_id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should coerce string available_points to number', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, available_points: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available_points).toBe(50);
      }
    });

    it('should coerce string total_points_earned to number', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, total_points_earned: '200' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_points_earned).toBe(200);
      }
    });

    it('should coerce string total_points_redeemed to number', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, total_points_redeemed: '100' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_points_redeemed).toBe(100);
      }
    });

    it('should transform string "true" to boolean true for is_active', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, is_active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should transform string "on" to boolean true for is_active', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, is_active: 'on' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should transform string "false" to boolean false for is_active', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, is_active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(false);
      }
    });

    it('should keep boolean values for is_active', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, is_active: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(false);
      }
    });
  });

  describe('edge cases', () => {
    it('should reject negative available_points', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, available_points: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject negative total_points_earned', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, total_points_earned: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject negative total_points_redeemed', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, total_points_redeemed: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer point values', () => {
      const result = BeneficiaryOrganizationSchema.safeParse({ ...validInput, available_points: 10.5 });
      expect(result.success).toBe(false);
    });

    it('should default is_active to true when omitted', () => {
      const result = BeneficiaryOrganizationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });
  });
});
