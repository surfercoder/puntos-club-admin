import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // First, get an organization and role to use
    const { data: orgs } = await supabase
      .from('organization')
      .select('id')
      .limit(1)
      .single();
    
    const { data: role } = await supabase
      .from('user_role')
      .select('id')
      .eq('name', 'owner')
      .single();
    
    if (!orgs || !role) {
      return NextResponse.json({ 
        error: 'Missing organization or role',
        orgs,
        role
      });
    }
    
    // Try to insert a test user directly
    const testUser = {
      organization_id: orgs.id,
      role_id: role.id,
      first_name: 'Test',
      last_name: 'User',
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'password123',
      active: true,
    };
    
    console.log('Attempting to insert test user:', testUser);
    
    const { data: newUser, error } = await supabase
      .from('app_user')
      .insert(testUser)
      .select()
      .single();
    
    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ 
        success: false,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        testUser: { ...testUser, password: '***' }
      });
    }
    
    console.log('User created successfully:', newUser);
    
    // Now verify it was inserted
    const { data: verifyUser, error: verifyError } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', newUser.id)
      .single();
    
    return NextResponse.json({ 
      success: true,
      newUser,
      verifyUser,
      verifyError
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
