import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'fede@owner.com';
    
    const supabase = await createClient();
    
    // Search in app_user
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('*')
      .eq('email', email);
    
    // Search in beneficiary
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from('beneficiary')
      .select('*')
      .eq('email', email);
    
    // Get all app_users to see what's there
    const { data: allUsers, error: allError } = await supabase
      .from('app_user')
      .select('id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return NextResponse.json({ 
      searchEmail: email,
      appUser: {
        found: appUser && appUser.length > 0,
        count: appUser?.length || 0,
        data: appUser,
        error: appUserError
      },
      beneficiary: {
        found: beneficiary && beneficiary.length > 0,
        count: beneficiary?.length || 0,
        data: beneficiary,
        error: beneficiaryError
      },
      recentUsers: {
        count: allUsers?.length || 0,
        data: allUsers,
        error: allError
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
