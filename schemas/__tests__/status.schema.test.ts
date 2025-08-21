import type { StatusInput} from '../status.schema';
import { StatusSchema } from '../status.schema';

describe('StatusSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid status data with all fields', () => {
      const validInput: StatusInput = {
        id: '1',
        name: 'Pending',
        description: 'Order is pending',
        is_terminal: false,
        order_num: 1,
      };

      const result = StatusSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should parse status with minimal required fields', () => {
      const validInput: StatusInput = {
        name: 'Completed',
        order_num: 5,
      };

      const result = StatusSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.is_terminal).toBe(false); // default value
      }
    });

    it('should apply default value for is_terminal', () => {
      const validInput: StatusInput = {
        name: 'Processing',
        order_num: 2,
      };

      const result = StatusSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.is_terminal).toBe(false);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should fail when name is missing', () => {
      const invalidInput = {
        order_num: 1,
      };

      const result = StatusSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should fail when name is empty', () => {
      const invalidInput = {
        name: '',
        order_num: 1,
      };

      const result = StatusSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should fail when order_num is missing', () => {
      const invalidInput = {
        name: 'Test',
      };

      const result = StatusSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should fail when order_num is not an integer', () => {
      const invalidInput = {
        name: 'Test',
        order_num: 1.5,
      };

      const result = StatusSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});