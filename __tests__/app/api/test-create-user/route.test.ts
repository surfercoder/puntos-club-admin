import { GET } from '@/app/api/test-create-user/route';

const mockSingleOrg = jest.fn();
const mockSingleRole = jest.fn();
const mockInsertSingle = jest.fn();
const mockVerifySingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn((table: string) => {
      if (table === 'organization') {
        return {
          select: jest.fn(() => ({
            limit: jest.fn(() => ({ single: mockSingleOrg })),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ single: mockSingleRole })),
          })),
        };
      }
      if (table === 'app_user') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({ single: mockInsertSingle })),
          })),
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ single: mockVerifySingle })),
          })),
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) })),
          limit: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) })),
        })),
      };
    }),
  })),
}));

describe('Test Create User API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingleOrg.mockResolvedValue({ data: { id: 1 } });
    mockSingleRole.mockResolvedValue({ data: { id: 10 } });
    mockInsertSingle.mockResolvedValue({ data: { id: 99, first_name: 'Test', last_name: 'User' }, error: null });
    mockVerifySingle.mockResolvedValue({ data: { id: 99, first_name: 'Test' }, error: null });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('returns error when organization not found', async () => {
    mockSingleOrg.mockResolvedValueOnce({ data: null });
    mockSingleRole.mockResolvedValueOnce({ data: { id: 10 } });

    const response = await GET();
    const data = await response.json();
    expect(data.error).toBe('Missing organization or role');
  });

  it('returns error when role not found', async () => {
    mockSingleOrg.mockResolvedValueOnce({ data: { id: 1 } });
    mockSingleRole.mockResolvedValueOnce({ data: null });

    const response = await GET();
    const data = await response.json();
    expect(data.error).toBe('Missing organization or role');
  });

  it('returns error when insert fails', async () => {
    mockInsertSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Duplicate', details: 'email exists', hint: null, code: '23505' },
    });

    const response = await GET();
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toBe('Duplicate');
    expect(data.error.code).toBe('23505');
    // password should be masked
    expect(data.testUser.password).toBe('***');
  });

  it('creates user successfully and verifies', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.newUser).toHaveProperty('id', 99);
    expect(data.verifyUser).toHaveProperty('id', 99);
  });

  it('handles unexpected errors', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValueOnce(new Error('Connection failed'));

    const response = await GET();
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Connection failed');
    expect(data.stack).toBeDefined();
  });

  it('handles non-Error thrown objects', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValueOnce('string error');

    const response = await GET();
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unknown error');
  });
});
