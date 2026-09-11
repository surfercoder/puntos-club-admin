import { createClient } from "@/lib/supabase/server";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { errorText } from '@/lib/error-handler';

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
        { success: false, error: await errorText('beneficiary.invalidId') },
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
        { success: false, error: await errorText('auth.notAuthenticated') },
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
        branch:branch(name)
      `
      )
      .eq("beneficiary_id", beneficiaryId)
      .order("purchase_date", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { success: false, error: await errorText('purchase.loadFailed') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: await errorText('unexpected') },
      { status: 500 }
    );
  }
}
