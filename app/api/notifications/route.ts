import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
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
        { success: false, error: "User not associated with an organization" },
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
        { success: false, error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
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
        { success: false, error: "Unauthorized" },
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
        { success: false, error: "User not associated with an organization" },
        { status: 403 }
      );
    }

    const role = Array.isArray(appUser.role) ? appUser.role[0] : appUser.role;
    const userIsAdmin = role?.name === 'admin';

    if (!role || !['owner', 'admin'].includes(role.name)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can create notifications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: notificationBody, organizationId: bodyOrgId } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { success: false, error: "Title and body are required" },
        { status: 400 }
      );
    }

    if (title.length > 65) {
      return NextResponse.json(
        { success: false, error: "Title must be 65 characters or less" },
        { status: 400 }
      );
    }

    if (notificationBody.length > 240) {
      return NextResponse.json(
        { success: false, error: "Body must be 240 characters or less" },
        { status: 400 }
      );
    }

    // Admin users can target a specific org via organizationId in the request body
    const targetOrgId = userIsAdmin && bodyOrgId ? Number(bodyOrgId) : appUser.organization_id;

    if (!targetOrgId) {
      return NextResponse.json(
        { success: false, error: "No target organization found" },
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
          error: "Notification limit reached",
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
        { success: false, error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
