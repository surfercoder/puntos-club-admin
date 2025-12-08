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
    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: "userId or email is required" },
        { status: 400 }
      );
    }

    // Search for beneficiary by email (since we don't have auth.users linked yet)
    const { data, error } = await supabase
      .from("beneficiary")
      .select("id, first_name, last_name, email, phone, available_points")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Beneficiary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Unexpected error verifying beneficiary:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
