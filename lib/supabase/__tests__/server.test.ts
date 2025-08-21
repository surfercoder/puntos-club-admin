import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createClient } from '../server';

jest.mock('@supabase/ssr');
jest.mock('next/headers');

const mockedCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;
const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;

describe('supabase/server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a server client with cookie handling', async () => {
    const mockClient = { auth: {} };
    const mockCookieStore = {
      getAll: jest.fn().mockReturnValue([
        { name: 'session', value: 'test-session' }
      ]),
      set: jest.fn(),
    };

    mockedCookies.mockResolvedValue(mockCookieStore as Awaited<ReturnType<typeof mockedCookies>>);
    mockedCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof mockedCreateServerClient>);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const client = await createClient();

    expect(mockedCookies).toHaveBeenCalled();
    expect(mockedCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        })
      })
    );
    expect(client).toBe(mockClient);
  });

  it('should handle cookie operations', async () => {
    const mockClient = { auth: {} };
    const mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };

    mockedCookies.mockResolvedValue(mockCookieStore as Awaited<ReturnType<typeof mockedCookies>>);
    mockedCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof mockedCreateServerClient>);

    await createClient();

    const cookiesConfig = mockedCreateServerClient.mock.calls[0][2];
    
    // Test getAll
    cookiesConfig?.cookies?.getAll();
    expect(mockCookieStore.getAll).toHaveBeenCalled();

    // Test setAll with valid cookies
    const testCookies = [
      { name: 'test', value: 'value', options: { httpOnly: true } }
    ];
    cookiesConfig?.cookies?.setAll(testCookies);
    expect(mockCookieStore.set).toHaveBeenCalledWith('test', 'value', { httpOnly: true });
  });

  it('should handle errors in setAll gracefully', async () => {
    const mockClient = { auth: {} };
    const mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn().mockImplementation(() => {
        throw new Error('Cannot set cookies in Server Component');
      }),
    };

    mockedCookies.mockResolvedValue(mockCookieStore as Awaited<ReturnType<typeof mockedCookies>>);
    mockedCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof mockedCreateServerClient>);

    await createClient();

    const cookiesConfig = mockedCreateServerClient.mock.calls[0][2];
    
    // Test setAll with error handling
    const testCookies = [
      { name: 'test', value: 'value', options: { httpOnly: true } }
    ];
    
    expect(() => {
      cookiesConfig?.cookies?.setAll(testCookies);
    }).not.toThrow();
  });
});