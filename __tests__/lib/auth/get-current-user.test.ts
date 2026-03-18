const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: jest.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
  })),
};

// Make select/update chainable returning eq -> single
mockSelect.mockReturnValue({ eq: mockEq });
mockUpdate.mockReturnValue({ eq: jest.fn() });
mockEq.mockReturnValue({ single: mockSingle });

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

import { getCurrentUser } from '@/lib/auth/get-current-user';

describe('getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockUpdate.mockReturnValue({ eq: jest.fn() });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it('returns null when auth error occurs', async () => {
    mockGetUser.mockResolvedValue({ data: {}, error: { message: 'Unauthorized' } });

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it('returns null when no auth user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it('returns user found by auth_user_id', async () => {
    const mockUser = { id: '1', first_name: 'John', email: 'john@test.com' };
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123', email: 'john@test.com' } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: mockUser });

    const result = await getCurrentUser();
    expect(result).toEqual(mockUser);
  });

  it('falls back to email lookup when auth_user_id not found', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123', email: 'john@test.com' } },
      error: null,
    });

    const mockUser = { id: '2', first_name: 'John', email: 'john@test.com' };

    // First call (by auth_user_id) returns null, second (by email) returns user
    mockSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: mockUser });

    const result = await getCurrentUser();
    expect(result).toEqual(mockUser);
    // Should have attempted backfill update
    expect(mockSupabase.from).toHaveBeenCalledWith('app_user');
  });

  it('returns null when no email and auth_user_id lookup fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123', email: undefined } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null });

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it('returns null when email lookup also fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123', email: 'john@test.com' } },
      error: null,
    });

    mockSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null });

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });
});
