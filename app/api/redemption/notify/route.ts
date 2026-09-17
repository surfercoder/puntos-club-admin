import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { errorText } from '@/lib/error-handler';
import { notifyRedemptionResolved } from '@/lib/notify-redemption';

// La app de cajero entrega y cancela con RPC contra la base, asi que el aviso no
// puede salir de ahi: este es el unico camino que tiene para pedirlo.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: await errorText('auth.notAuthenticated') },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: await errorText('auth.notAuthenticated') },
        { status: 401 }
      );
    }

    const { data: appUser } = await supabase
      .from("app_user")
      .select("id, organization_id, role:user_role(name)")
      .eq("auth_user_id", user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json(
        { success: false, error: await errorText('auth.noOrganization') },
        { status: 403 }
      );
    }

    const role = Array.isArray(appUser.role) ? appUser.role[0] : appUser.role;
    if (
      !role ||
      !["cashier", "owner", "collaborator", "admin"].includes(
        (role as { name: string }).name
      )
    ) {
      return NextResponse.json(
        { success: false, error: await errorText('db.forbidden') },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { redemptionId } = body;

    if (!redemptionId) {
      return NextResponse.json(
        { success: false, error: "redemptionId is required" },
        { status: 400 }
      );
    }

    // El canje tiene que ser de la organizacion del cajero: sin esto cualquier
    // cajero podria disparar avisos de canjes ajenos.
    const { data: redemption } = await supabase
      .from("redemption")
      .select("id")
      .eq("id", redemptionId)
      .eq("organization_id", appUser.organization_id)
      .single();

    if (!redemption) {
      return NextResponse.json(
        { success: false, error: await errorText('db.forbidden') },
        { status: 403 }
      );
    }

    const push = await notifyRedemptionResolved(redemptionId);

    if (!push) {
      return NextResponse.json(
        { success: false, error: await errorText('db.notFound') },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, push });
  } catch (error) {
    console.error("[redemption/notify] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: await errorText('unexpected') },
      { status: 500 }
    );
  }
}
