import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test 1: Simple query without relations
    const { data: simpleUsers, error: simpleError } = await supabase
      .from('app_user')
      .select('*')
      .order('created_at', { ascending: false });

    // Test 2: Query with relations (current implementation)
    const { data: relatedUsers, error: relatedError } = await supabase
      .from('app_user')
      .select(`
        *,
        organization:organization_id(id, name),
        role:role_id(id, name, display_name)
      `)
      .order('created_at', { ascending: false });
    
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
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
