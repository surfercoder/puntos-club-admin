import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "../env";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow API routes to be accessed without authentication (for mobile apps)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Check user role for protected routes (dashboard)
  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // First try to find by auth_user_id, then fallback to email
    let appUser = null;

    const { data: userByAuthId } = await supabase
      .from('app_user')
      .select('id, auth_user_id, role:role_id(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (userByAuthId) {
      appUser = userByAuthId;
    } else if (user.email) {
      // Fallback: try to find by email (for users created before auth_user_id was added)
      const { data: userByEmail } = await supabase
        .from('app_user')
        .select('id, auth_user_id, role:role_id(name)')
        .eq('email', user.email)
        .single();

      if (userByEmail) {
        appUser = userByEmail;
        // Update the auth_user_id for future requests
        await supabase
          .from('app_user')
          .update({ auth_user_id: user.id })
          .eq('id', userByEmail.id);
      }
    }

    const role = appUser?.role as unknown as { name: string } | null;
    const roleName = role?.name;
    const allowedRoles = ['admin', 'owner', 'collaborator'];

    if (!roleName || !allowedRoles.includes(roleName)) {
      // User is not allowed to access the admin portal - sign them out and redirect
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
