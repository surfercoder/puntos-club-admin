import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Try to get auth token from Authorization header (for mobile apps)
    const authHeader = request.headers.get("authorization");
    let supabase;
    
    if (authHeader?.startsWith("Bearer ")) {
      // Mobile app with JWT token
      const token = authHeader.substring(7);
      supabase = createSupabaseClient(
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
    } else {
      // Web app with cookie session
      supabase = await createClient();
    }

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { beneficiary_id, branch_id, amount, items, notes } = body;

    // Get cashier_id from authenticated user's app_user record
    const { data: appUser, error: appUserError } = await supabase
      .from("app_user")
      .select("id")
      .eq("email", user.email)
      .single();

    if (appUserError || !appUser) {
      console.error("Error finding app_user for email:", user.email, appUserError);
      return NextResponse.json(
        { success: false, error: "Cashier profile not found. Please contact administrator." },
        { status: 404 }
      );
    }

    const cashier_id = appUser.id;

    // Validate input
    if (!beneficiary_id || !branch_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: beneficiary_id or branch_id",
        },
        { status: 400 }
      );
    }

    // Support both simplified amount and detailed items
    let total_amount: number;
    let purchaseItems: { item_name: string; quantity: number; unit_price: number }[] = [];

    if (amount !== undefined && amount !== null) {
      // Simplified mode: just amount
      total_amount = parseFloat(amount);
      if (isNaN(total_amount) || total_amount <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid purchase amount" },
          { status: 400 }
        );
      }
      // Create a generic purchase item
      purchaseItems = [{
        item_name: 'Purchase',
        quantity: 1,
        unit_price: total_amount,
      }];
    } else if (items && Array.isArray(items) && items.length > 0) {
      // Detailed mode: items array (backward compatible)
      // Validate all items
      for (const item of items) {
        if (!item.item_name || item.quantity <= 0 || item.unit_price < 0) {
          return NextResponse.json(
            { success: false, error: "Invalid item data" },
            { status: 400 }
          );
        }
      }
      // Calculate total amount
      total_amount = items.reduce(
        (sum: number, item: { item_name: string; quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price,
        0
      );
      purchaseItems = items;
    } else {
      return NextResponse.json(
        { success: false, error: "Either amount or items array is required" },
        { status: 400 }
      );
    }

    // Get branch details to find organization_id
    const { data: branch, error: branchError } = await supabase
      .from("branch")
      .select("organization_id")
      .eq("id", branch_id)
      .single();

    if (branchError || !branch) {
      return NextResponse.json(
        { success: false, error: "Branch not found" },
        { status: 404 }
      );
    }

    // Calculate points using the database function
    const { data: pointsData, error: pointsError } = await supabase.rpc(
      "calculate_points_for_amount",
      {
        p_amount: total_amount,
        p_organization_id: branch.organization_id,
        p_branch_id: branch_id,
        p_category_id: null,
        p_purchase_time: new Date().toISOString(),
      }
    );

    let points_earned = 0;
    
    if (pointsError) {
      console.error("Error calculating points:", pointsError);
      console.error("Parameters:", {
        p_amount: total_amount,
        p_organization_id: branch.organization_id,
        p_branch_id: branch_id,
        p_category_id: null,
      });
      // Fallback to simple calculation: 2 points per dollar
      points_earned = Math.floor(total_amount * 2);
      console.warn("Using fallback points calculation:", points_earned);
    } else {
      points_earned = pointsData || 0;
    }

    // Create the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchase")
      .insert({
        beneficiary_id,
        cashier_id,
        branch_id,
        total_amount,
        points_earned,
        notes,
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error("Error creating purchase:", purchaseError);
      return NextResponse.json(
        { success: false, error: "Failed to create purchase" },
        { status: 500 }
      );
    }

    // Create purchase items with purchase_id
    const itemsToInsert = purchaseItems.map((item) => ({
      purchase_id: purchase.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
      points_earned: Math.floor(
        (item.quantity * item.unit_price * points_earned) / total_amount
      ),
    }));

    const { error: itemsError } = await supabase
      .from("purchase_item")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error creating purchase items:", itemsError);
      return NextResponse.json(
        { success: false, error: "Failed to create purchase items" },
        { status: 500 }
      );
    }

    // Get updated beneficiary balance
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from("beneficiary")
      .select("available_points")
      .eq("id", beneficiary_id)
      .single();

    if (beneficiaryError || !beneficiary) {
      console.error("Error fetching beneficiary:", beneficiaryError);
    }

    return NextResponse.json({
      success: true,
      data: {
        purchase_id: purchase.id,
        purchase_number: purchase.purchase_number,
        total_amount: parseFloat(purchase.total_amount),
        points_earned: purchase.points_earned,
        beneficiary_new_balance: beneficiary?.available_points || 0,
      },
    });
  } catch (error) {
    console.error("Unexpected error creating purchase:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
