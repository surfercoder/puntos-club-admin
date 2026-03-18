import { BeneficiarySchema } from '@/schemas/beneficiary.schema';

describe('BeneficiarySchema', () => {
  describe('valid input', () => {
    it('should accept minimal valid input (empty object uses defaults)', () => {
      const result = BeneficiarySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = BeneficiarySchema.safeParse({
        id: 'ben-1',
        first_name: 'Maria',
        last_name: 'Garcia',
        email: 'maria@example.com',
        phone: '+5491123456789',
        document_id: 'DNI12345',
        registration_date: '2024-01-01',
        address_id: 'addr-1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('nullable fields', () => {
    it('should accept null for first_name', () => {
      const result = BeneficiarySchema.safeParse({ first_name: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBeNull();
      }
    });

    it('should accept null for last_name', () => {
      const result = BeneficiarySchema.safeParse({ last_name: null });
      expect(result.success).toBe(true);
    });

    it('should accept null for email', () => {
      const result = BeneficiarySchema.safeParse({ email: null });
      expect(result.success).toBe(true);
    });

    it('should accept null for phone', () => {
      const result = BeneficiarySchema.safeParse({ phone: null });
      expect(result.success).toBe(true);
    });

    it('should accept null for document_id', () => {
      const result = BeneficiarySchema.safeParse({ document_id: null });
      expect(result.success).toBe(true);
    });

    it('should accept null for address_id', () => {
      const result = BeneficiarySchema.safeParse({ address_id: null });
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should reject invalid email format', () => {
      const result = BeneficiarySchema.safeParse({ email: 'not-email' });
      expect(result.success).toBe(false);
    });
  });
});
