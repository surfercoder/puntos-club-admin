import { createClient } from "@/lib/supabase/server";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const beneficiaryId = parseInt(id);

    if (isNaN(beneficiaryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid beneficiary ID" },
        { status: 400 }
      );
    }

    // Verify authentication
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

    // Get purchase history
    const { data, error } = await supabase
      .from("purchase")
      .select(
        `
        *,
        cashier:app_user!purchase_cashier_id_fkey(first_name, last_name),
        branch:branch(name),
        purchase_item(*)
      `
      )
      .eq("beneficiary_id", beneficiaryId)
      .order("purchase_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching purchases:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch purchases" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Unexpected error fetching purchases:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
