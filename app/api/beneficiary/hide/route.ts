import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { errorText } from '@/lib/error-handler';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: await errorText('auth.notAuthenticated') },
        { status: 401 }
      );
    }

    const { beneficiary_id, organization_id, is_hidden } = await request.json();

    if (!beneficiary_id || !organization_id || typeof is_hidden !== "boolean") {
      return NextResponse.json(
        { error: await errorText('db.missingField') },
        { status: 400 }
      );
    }

    // Verify the current user belongs to the organization
    if (currentUser.organization_id?.toString() !== organization_id.toString()) {
      return NextResponse.json(
        { error: await errorText('beneficiary.hideForbidden') },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Check if a beneficiary_organization record exists
    const { data: existing } = await supabase
      .from("beneficiary_organization")
      .select("id")
      .eq("beneficiary_id", beneficiary_id)
      .eq("organization_id", organization_id)
      .single();

    if (existing) {
      // Update existing record — hiding deactivates membership, unhiding reactivates it
      const { error } = await supabase
        .from("beneficiary_organization")
        .update({ is_hidden, is_active: !is_hidden })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Create a new record with is_hidden = true (beneficiary hasn't joined yet but we want to block them)
      const { error } = await supabase
        .from("beneficiary_organization")
        .insert({
          beneficiary_id,
          organization_id,
          is_hidden,
          is_active: false,
          available_points: 0,
          total_points_earned: 0,
          total_points_redeemed: 0,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: await errorText('unexpected') },
      { status: 500 }
    );
  }
}
