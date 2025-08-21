import { createBrowserClient } from '@supabase/ssr';

import { createClient } from '../client';

jest.mock('@supabase/ssr');

const mockedCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;

describe('supabase/client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a browser client with environment variables', () => {
    const mockClient = { auth: {} };
    mockedCreateBrowserClient.mockReturnValue(mockClient as ReturnType<typeof mockedCreateBrowserClient>);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const client = createClient();

    expect(mockedCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
    expect(client).toBe(mockClient);
  });
});