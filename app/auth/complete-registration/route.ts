import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { verifyRegistrationToken } from '@/lib/registration-token';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const pending = verifyRegistrationToken(token);
  if (!pending) {
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid_or_expired_token`);
  }

  try {
    const adminClient = createAdminClient();

    // Create the auth user only NOW — after the owner clicked the email link.
    const { error: createError } = await adminClient.auth.admin.createUser({
      email: pending.email,
      password: pending.password,
      email_confirm: true, // confirmed because they clicked the link
      user_metadata: {
        first_name: pending.firstName,
        last_name: pending.lastName,
        role_name: 'owner',
        onboarding: true,
      },
    });

    // Treat "already registered" as OK — they may have clicked the link twice.
    if (createError && !createError.message?.toLowerCase().includes('already been registered')) {
      console.error('[complete-registration] createUser error:', createError.message);
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    // Sign them in to establish a session cookie.
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: pending.email,
      password: pending.password,
    });

    if (signInError) {
      console.error('[complete-registration] signIn error:', signInError.message);
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    return NextResponse.redirect(`${origin}${pending.redirectTo}`);
  } catch (err) {
    console.error('[complete-registration] Unexpected error:', err);
    return NextResponse.redirect(`${origin}/auth/error`);
  }
}
