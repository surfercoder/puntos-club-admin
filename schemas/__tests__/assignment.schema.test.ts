import type { AssignmentInput} from '../assignment.schema';
import { AssignmentSchema } from '../assignment.schema';

describe('AssignmentSchema', () => {
  describe('valid inputs', () => {
    it('should parse valid assignment data', () => {
      const validInput: AssignmentInput = {
        id: '1',
        branch_id: 'branch-1',
        beneficiary_id: 'ben-1',
        user_id: 'user-1',
        points: 100,
        reason: 'Purchase',
        assignment_date: '2023-01-01',
        observations: 'Test obs',
      };

      const result = AssignmentSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should parse with minimal fields', () => {
      const validInput: AssignmentInput = {
        branch_id: 'branch-1',
        beneficiary_id: 'ben-1',
        points: 50,
      };

      const result = AssignmentSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should fail when required fields are missing', () => {
      const invalidInput = {};
      const result = AssignmentSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should fail when points is not an integer', () => {
      const invalidInput = {
        branch_id: 'branch-1',
        beneficiary_id: 'ben-1',
        points: 10.5,
      };
      const result = AssignmentSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});