import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "../env";
import { hasEnvVars } from "../utils";

const ADMIN_PORTAL_ROLES = ["admin", "owner", "collaborator"];

// Rutas que no exigen sesión ni rol de portal: públicas, el flujo de auth
// (incluye la recuperación de contraseña de los cajeros) y el alta de owners.
// /legal es público por obligación: Google Play abre la Política sin sesión.
const OPEN_PATHS = ["/auth", "/api", "/legal", "/mobile-apps", "/owner/onboarding", "/login"];
const isOpenPath = (pathname: string) =>
  pathname === "/" || OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

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
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
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

  // `getUser()` puede haber refrescado la sesión: esas cookies viven en
  // supabaseResponse, así que un redirect que no las copie desloguea al usuario.
  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach(({ name, value, ...options }) => response.cookies.set(name, value, options));
    return response;
  };

  // A valid session has nothing to do on the login page — same rule the
  // onboarding page applies. (To use another account, log out first.)
  if (user && request.nextUrl.pathname.startsWith("/auth/login")) {
    return redirectTo("/dashboard");
  }

  // Allow API routes to be accessed without authentication (for mobile apps)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  if (!user && !isOpenPath(request.nextUrl.pathname)) {
    // no user, potentially respond by redirecting the user to the login page
    return redirectTo("/auth/login");
  }

  // El login ya rechaza a cajeros y beneficiarios, pero hay sesiones que no
  // pasan por ahí: el link de recuperación que manda la app de Caja, /auth/callback
  // y /auth/confirm. Por eso el rol se valida acá, que también cubre las server
  // actions (varias usan service role y RLS no las frena).
  if (user && !isOpenPath(request.nextUrl.pathname)) {
    const { data, error } = await supabase
      .from("app_user")
      .select("role:user_role(name)")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    // Un fallo de la consulta no prueba que no tenga rol: se corta igual, pero sin desloguear.
    if (error) {
      return redirectTo("/auth/error");
    }
    const role = (data?.role as unknown as { name: string } | null)?.name;
    if (!role || !ADMIN_PORTAL_ROLES.includes(role)) {
      await supabase.auth.signOut({ scope: "local" });
      return redirectTo("/auth/error", "?reason=no_access");
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
