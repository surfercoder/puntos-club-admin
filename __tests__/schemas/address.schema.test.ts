import { AddressSchema } from '@/schemas/address.schema';

describe('AddressSchema', () => {
  const validAddress = {
    city: 'Buenos Aires',
    number: '1234',
    state: 'CABA',
    street: 'Av. Corrientes',
    zip_code: 'C1043',
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = AddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = AddressSchema.safeParse({
        ...validAddress,
        id: 'abc-123',
        organization_id: 'org-1',
        country: 'Argentina',
        place_id: 'place-xyz',
        latitude: -34.6037,
        longitude: -58.3816,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(-34.6037);
        expect(result.data.longitude).toBe(-58.3816);
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing city', () => {
      const { city: _city, ...rest } = validAddress;
      const result = AddressSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing number', () => {
      const { number: _number, ...rest } = validAddress;
      const result = AddressSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing state', () => {
      const { state: _state, ...rest } = validAddress;
      const result = AddressSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing street', () => {
      const { street: _street, ...rest } = validAddress;
      const result = AddressSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing zip_code', () => {
      const { zip_code: _zip_code, ...rest } = validAddress;
      const result = AddressSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should reject empty string for city', () => {
      const result = AddressSchema.safeParse({ ...validAddress, city: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty string for number', () => {
      const result = AddressSchema.safeParse({ ...validAddress, number: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty string for state', () => {
      const result = AddressSchema.safeParse({ ...validAddress, state: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty string for street', () => {
      const result = AddressSchema.safeParse({ ...validAddress, street: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty string for zip_code', () => {
      const result = AddressSchema.safeParse({ ...validAddress, zip_code: '' });
      expect(result.success).toBe(false);
    });

    it('should reject non-number latitude', () => {
      const result = AddressSchema.safeParse({ ...validAddress, latitude: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should reject non-number longitude', () => {
      const result = AddressSchema.safeParse({ ...validAddress, longitude: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should accept omitted optional fields as undefined', () => {
      const result = AddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
        expect(result.data.organization_id).toBeUndefined();
        expect(result.data.country).toBeUndefined();
        expect(result.data.place_id).toBeUndefined();
        expect(result.data.latitude).toBeUndefined();
        expect(result.data.longitude).toBeUndefined();
      }
    });
  });
});
