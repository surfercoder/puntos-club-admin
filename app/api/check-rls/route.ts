import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check RLS status by querying pg_tables
    await supabase.rpc('check_rls_status');

    // Alternative: Try to query with and without auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Query as authenticated user
    const { data: authQuery, error: authError } = await supabase
      .from('app_user')
      .select('count');
    
    return NextResponse.json({ 
      authUser: authUser?.id || 'none',
      authQuery: {
        count: authQuery?.length,
        error: authError
      },
      message: 'RLS is likely enabled if authenticated queries return 0 but direct inserts work'
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
