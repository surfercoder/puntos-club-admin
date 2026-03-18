import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    if (!role || !['owner', 'admin'].includes(role.name)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can edit notifications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: notificationBody } = body;

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

    const { data: notification, error } = await supabase
      .from("push_notifications")
      .update({
        title,
        body: notificationBody,
        status: 'draft',
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to update notification" },
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
