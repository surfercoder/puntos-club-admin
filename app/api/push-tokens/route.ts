import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: beneficiary } = await supabase
      .from("beneficiary")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!beneficiary) {
      return NextResponse.json(
        { success: false, error: "Beneficiary not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { expoPushToken, deviceId, platform } = body;

    if (!expoPushToken) {
      return NextResponse.json(
        { success: false, error: "expoPushToken is required" },
        { status: 400 }
      );
    }

    const { data: existingToken } = await supabase
      .from("push_tokens")
      .select("*")
      .eq("beneficiary_id", beneficiary.id)
      .eq("expo_push_token", expoPushToken)
      .single();

    if (existingToken) {
      const { data: updated, error } = await supabase
        .from("push_tokens")
        .update({
          is_active: true,
          device_id: deviceId,
          platform,
        })
        .eq("id", existingToken.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to update push token" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updated,
      });
    }

    const { data: newToken, error } = await supabase
      .from("push_tokens")
      .insert({
        beneficiary_id: beneficiary.id,
        expo_push_token: expoPushToken,
        device_id: deviceId,
        platform,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to create push token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newToken,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
