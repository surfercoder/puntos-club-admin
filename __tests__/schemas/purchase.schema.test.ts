import { PurchaseSchema } from '@/schemas/purchase.schema';

describe('PurchaseSchema', () => {
  const validInput = {
    beneficiary_id: 'ben-1',
    total_amount: 1500.50,
  };

  describe('valid input', () => {
    it('should accept minimal valid input', () => {
      const result = PurchaseSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.beneficiary_id).toBe('ben-1');
        expect(result.data.total_amount).toBe(1500.50);
      }
    });

    it('should accept all fields', () => {
      const result = PurchaseSchema.safeParse({
        ...validInput,
        id: 'pur-1',
        branch_id: 'branch-1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('pur-1');
        expect(result.data.branch_id).toBe('branch-1');
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject missing beneficiary_id', () => {
      const { beneficiary_id: _beneficiary_id, ...rest } = validInput;
      const result = PurchaseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty beneficiary_id', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, beneficiary_id: '' });
      expect(result.success).toBe(false);
    });

    it('ignores a client-supplied cashier_id (owner is injected server-side)', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, cashier_id: 'spoofed' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).cashier_id).toBeUndefined();
      }
    });

    it('should reject missing total_amount', () => {
      const { total_amount: _total_amount, ...rest } = validInput;
      const result = PurchaseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('type transforms', () => {
    it('should transform string total_amount to number', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, total_amount: '2500.75' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_amount).toBe(2500.75);
      }
    });

    it('should keep number total_amount as-is', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, total_amount: 999 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_amount).toBe(999);
      }
    });

    // Con safeParse y no con parse: el server action usa safeParse, y un throw
    // crudo adentro del transform se le escapa en vez de volver como fieldError.
    it.each([-10, 'abc', '-10'])('should reject total_amount %j via safeParse', (amount) => {
      const result = PurchaseSchema.safeParse({ ...validInput, total_amount: amount });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['total_amount']);
        expect(result.error.issues[0].message).toBe('Amount must be a non-negative number');
      }
    });

    it('should reject a negative points_earned via safeParse', () => {
      const result = PurchaseSchema.safeParse({
        ...validInput,
        mode: 'assignment',
        points_earned: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Points must be a non-negative number');
      }
    });

    it('should transform empty branch_id to null', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, branch_id: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch_id).toBeNull();
      }
    });

    it('should keep valid branch_id string', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, branch_id: 'branch-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch_id).toBe('branch-1');
      }
    });

    it('should accept null branch_id', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, branch_id: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch_id).toBeNull();
      }
    });
  });

  describe('notes', () => {
    it.each([
      ['', null],
      [null, null],
      ['Compra con descuento', 'Compra con descuento'],
    ])('normaliza %j a %j', (input, expected) => {
      const result = PurchaseSchema.safeParse({ ...validInput, notes: input });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe(expected);
      }
    });
  });

  // El modo decide qué campo numérico es obligatorio: una venta cobra importe,
  // una asignación otorga puntos a mano.
  describe('campos obligatorios según el modo', () => {
    it('exige el importe en una venta', () => {
      const { total_amount: _omitido, ...sinImporte } = validInput;
      const result = PurchaseSchema.safeParse({ ...sinImporte, mode: 'sale' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['total_amount']);
        expect(result.error.issues[0].message).toBe('Amount is required');
      }
    });

    it('exige los puntos en una asignación', () => {
      const { total_amount: _omitido, ...sinImporte } = validInput;
      const result = PurchaseSchema.safeParse({ ...sinImporte, mode: 'assignment' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['points_earned']);
        expect(result.error.issues[0].message).toBe('Points are required');
      }
    });

    it('acepta una asignación con puntos y sin importe', () => {
      const { total_amount: _omitido, ...sinImporte } = validInput;
      const result = PurchaseSchema.safeParse({
        ...sinImporte,
        mode: 'assignment',
        points_earned: 250,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.points_earned).toBe(250);
        expect(result.data.total_amount).toBeUndefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should leave id undefined when omitted', () => {
      const result = PurchaseSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should accept total_amount of 0', () => {
      const result = PurchaseSchema.safeParse({ ...validInput, total_amount: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_amount).toBe(0);
      }
    });
  });
});
