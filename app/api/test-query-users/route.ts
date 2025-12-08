import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test 1: Simple query without relations
    console.log('Test 1: Simple query');
    const { data: simpleUsers, error: simpleError } = await supabase
      .from('app_user')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Simple query result:', { count: simpleUsers?.length, error: simpleError });
    
    // Test 2: Query with relations (current implementation)
    console.log('Test 2: Query with relations');
    const { data: relatedUsers, error: relatedError } = await supabase
      .from('app_user')
      .select(`
        *,
        organization:organization_id(id, name),
        role:role_id(id, name, display_name)
      `)
      .order('created_at', { ascending: false });
    
    console.log('Related query result:', { count: relatedUsers?.length, error: relatedError });
    
    return NextResponse.json({ 
      simpleQuery: {
        count: simpleUsers?.length || 0,
        error: simpleError,
        sample: simpleUsers?.[0]
      },
      relatedQuery: {
        count: relatedUsers?.length || 0,
        error: relatedError,
        sample: relatedUsers?.[0]
      }
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
