import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { verifyRegistrationToken } from '@/lib/registration-token';

// ponytail: linear scan over auth users — fine for an admin-sized owner base;
// swap for an indexed RPC lookup if this ever holds thousands of owners.
async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
  }
  return null;
}

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

    // User already exists (link clicked twice, or a prior unfinished
    // registration). Clicking a fresh link proves they control the email, so
    // set their password to the one they just chose — otherwise the sign-in
    // below fails with "Invalid login credentials".
    if (createError) {
      if (!createError.message?.toLowerCase().includes('already been registered')) {
        throw new Error(`createUser failed: ${createError.message}`);
      }

      const existingId = await findAuthUserIdByEmail(adminClient, pending.email);
      if (!existingId) {
        throw new Error('user reported as existing but not found during lookup');
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(existingId, {
        password: pending.password,
        email_confirm: true,
        user_metadata: {
          first_name: pending.firstName,
          last_name: pending.lastName,
          role_name: 'owner',
          onboarding: true,
        },
      });
      if (updateError) {
        throw new Error(`updateUser failed: ${updateError.message}`);
      }
    }

    // Sign them in to establish a session cookie.
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: pending.email,
      password: pending.password,
    });
    if (signInError) {
      throw new Error(`signIn failed: ${signInError.message}`);
    }

    return NextResponse.redirect(`${origin}${pending.redirectTo}`);
  } catch (err) {
    console.error('[complete-registration]', err);
    Sentry.captureException(err, { tags: { area: 'onboarding.complete-registration' } });
    return NextResponse.redirect(`${origin}/auth/error?reason=registration_failed`);
  }
}
