import { createClient } from "@/lib/supabase/server";
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
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json(
        { success: false, error: "User not associated with an organization" },
        { status: 403 }
      );
    }

    const { data: limits, error } = await supabase
      .from("organization_notification_limits")
      .select("*")
      .eq("organization_id", appUser.organization_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching limits:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch limits" },
        { status: 500 }
      );
    }

    if (!limits) {
      const { data: newLimits } = await supabase
        .from("organization_notification_limits")
        .insert({
          organization_id: appUser.organization_id,
          plan_type: 'free',
          daily_limit: 1,
          monthly_limit: 5,
          min_hours_between_notifications: 24,
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        data: newLimits,
      });
    }

    const { data: canSend } = await supabase.rpc('can_send_notification', {
      org_id: appUser.organization_id,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...limits,
        can_send_now: canSend,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
