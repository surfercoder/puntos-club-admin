import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { errorText } from '@/lib/error-handler';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

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
      .select("organization_id, role:user_role(name)")
      .eq("auth_user_id", user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json(
        { success: false, error: await errorText('auth.noOrganization') },
        { status: 403 }
      );
    }

    const { data: notifications, error } = await supabase
      .from("push_notifications")
      .select(`
        *,
        creator:app_user!push_notifications_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("organization_id", appUser.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: await errorText('notifications.loadFailed') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: await errorText('unexpected') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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
    const userIsAdmin = role?.name === 'admin';

    if (!role || !['owner', 'collaborator', 'admin'].includes(role.name)) {
      return NextResponse.json(
        { success: false, error: await errorText('auth.onlyOwnersAdmins') },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: notificationBody, organizationId: bodyOrgId } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { success: false, error: await errorText('notifications.titleAndBodyRequired') },
        { status: 400 }
      );
    }

    if (title.length > 65) {
      return NextResponse.json(
        { success: false, error: await errorText('notifications.titleTooLong') },
        { status: 400 }
      );
    }

    if (notificationBody.length > 240) {
      return NextResponse.json(
        { success: false, error: await errorText('notifications.bodyTooLong') },
        { status: 400 }
      );
    }

    // Admin users can target a specific org via organizationId in the request body
    const targetOrgId = userIsAdmin && bodyOrgId ? Number(bodyOrgId) : appUser.organization_id;

    if (!targetOrgId) {
      return NextResponse.json(
        { success: false, error: await errorText('organization.noActive') },
        { status: 400 }
      );
    }

    // Use admin client for DB operations when acting on behalf of another org
    const dbClient = userIsAdmin && bodyOrgId ? createAdminClient() : supabase;

    const { data: canSend } = await dbClient.rpc('can_send_notification', {
      org_id: targetOrgId,
    });

    if (!canSend) {
      const { data: limits } = await dbClient
        .from('organization_notification_limits')
        .select('*')
        .eq('organization_id', targetOrgId)
        .single();

      return NextResponse.json(
        {
          success: false,
          error: await errorText('notifications.limitReached'),
          limits,
        },
        { status: 429 }
      );
    }

    const { data: notification, error } = await dbClient
      .from("push_notifications")
      .insert({
        organization_id: targetOrgId,
        created_by: appUser.id,
        title,
        body: notificationBody,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: await errorText('notifications.createFailed') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: await errorText('unexpected') },
      { status: 500 }
    );
  }
}
