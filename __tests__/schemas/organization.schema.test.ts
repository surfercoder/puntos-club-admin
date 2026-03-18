import { OrganizationSchema } from '@/schemas/organization.schema';

describe('OrganizationSchema', () => {
  const validOrg = {
    name: 'My Organization',
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = OrganizationSchema.safeParse(validOrg);
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = OrganizationSchema.safeParse({
        ...validOrg,
        id: 'org-1',
        business_name: 'My Org LLC',
        tax_id: 'TAX-123',
        logo_url: 'https://example.com/logo.png',
        creation_date: '2024-01-01',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should reject missing name', () => {
      const result = OrganizationSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = OrganizationSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('nullable fields', () => {
    it('should accept null for business_name', () => {
      const result = OrganizationSchema.safeParse({ ...validOrg, business_name: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.business_name).toBeNull();
      }
    });

    it('should accept null for tax_id', () => {
      const result = OrganizationSchema.safeParse({ ...validOrg, tax_id: null });
      expect(result.success).toBe(true);
    });

    it('should accept null for logo_url', () => {
      const result = OrganizationSchema.safeParse({ ...validOrg, logo_url: null });
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should accept omitted optional fields', () => {
      const result = OrganizationSchema.safeParse(validOrg);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
        expect(result.data.business_name).toBeUndefined();
        expect(result.data.tax_id).toBeUndefined();
        expect(result.data.logo_url).toBeUndefined();
        expect(result.data.creation_date).toBeUndefined();
      }
    });
  });
});
