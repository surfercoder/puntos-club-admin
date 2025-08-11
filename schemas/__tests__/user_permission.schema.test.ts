import { UserPermissionSchema } from '../user_permission.schema';

describe('UserPermissionSchema', () => {
  it('should parse valid user permission data', () => {
    const validInput = {
      user_id: 'user-1',
      branch_id: 'branch-1',
      action: 'read',
    };
    const result = UserPermissionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should fail when action is empty', () => {
    const invalidInput = {
      user_id: 'user-1',
      branch_id: 'branch-1',
      action: '',
    };
    const result = UserPermissionSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});