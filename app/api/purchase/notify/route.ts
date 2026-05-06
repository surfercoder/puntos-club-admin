import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import {
  brandedEmailLayout,
  sectionHeading,
  subtitle,
  dataTable,
} from "@/lib/email-template";

interface ExpoPushMessage {
  to: string;
  sound?: "default";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendPushNotifications(messages: ExpoPushMessage[]) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push service error: ${response.statusText}`);
  }

  return response.json();
}

function buildPurchaseEmailHtml(params: {
  beneficiaryName: string;
  organizationName: string;
  pointsEarned: number;
  totalAmount: number;
  newBalance: number;
}): string {
  const {
    beneficiaryName,
    organizationName,
    pointsEarned,
    totalAmount,
    newBalance,
  } = params;

  const body = `
    ${sectionHeading(`Ganaste ${pointsEarned.toLocaleString("es-AR")} puntos`)}
    ${subtitle(`Tu compra en ${organizationName} te sumó puntos.`)}

    <p style="margin:0 0 20px">
      Hola <strong>${beneficiaryName}</strong>, tu compra fue registrada con éxito.
    </p>

    ${dataTable([
      {
        label: "Monto",
        value: `$${totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
      },
      {
        label: "Puntos ganados",
        value: `<strong style="color:#4BB562">+${pointsEarned.toLocaleString("es-AR")}</strong>`,
      },
      {
        label: "Tu saldo",
        value: `<strong>${newBalance.toLocaleString("es-AR")} puntos</strong>`,
      },
    ])}

    <p style="margin:20px 0 0;font-size:13px;color:#6B7280">
      Seguí acumulando puntos con cada compra y canjealos por premios exclusivos.
    </p>
  `;

  return brandedEmailLayout(body);
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the cashier via their Supabase access token
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
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

    // Verify this is a cashier
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
    if (
      !role ||
      !["cashier", "owner", "admin"].includes(
        (role as { name: string }).name
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { beneficiaryId, pointsEarned, totalAmount, organizationId } = body;

    if (!beneficiaryId || pointsEarned == null || !totalAmount) {
      return NextResponse.json(
        {
          success: false,
          error:
            "beneficiaryId, pointsEarned, and totalAmount are required",
        },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for cross-table lookups
    const adminClient = createAdminClient();

    // Fetch beneficiary details
    const { data: beneficiary } = await adminClient
      .from("beneficiary")
      .select("id, first_name, last_name, email")
      .eq("id", beneficiaryId)
      .single();

    if (!beneficiary) {
      return NextResponse.json(
        { success: false, error: "Beneficiary not found" },
        { status: 404 }
      );
    }

    // Fetch organization name
    const { data: organization } = await adminClient
      .from("organization")
      .select("name")
      .eq("id", organizationId || appUser.organization_id)
      .single();

    const orgName = organization?.name || "la tienda";

    // Fetch the beneficiary's updated points balance
    const { data: beneficiaryOrg } = await adminClient
      .from("beneficiary_organization")
      .select("available_points")
      .eq("beneficiary_id", beneficiaryId)
      .eq("organization_id", organizationId || appUser.organization_id)
      .single();

    const newBalance = beneficiaryOrg?.available_points ?? pointsEarned;
    const beneficiaryName =
      `${beneficiary.first_name || ""} ${beneficiary.last_name || ""}`.trim() ||
      "Cliente";

    // --- Send push notification ---
    const { data: pushTokens } = await adminClient
      .from("push_tokens")
      .select("id, expo_push_token")
      .eq("beneficiary_id", beneficiaryId)
      .eq("is_active", true);

    let pushSent = 0;
    let pushFailed = 0;

    if (pushTokens && pushTokens.length > 0) {
      const messages: ExpoPushMessage[] = pushTokens.map((t) => ({
        to: t.expo_push_token,
        sound: "default" as const,
        title: `+${pointsEarned.toLocaleString("es-AR")} puntos en ${orgName}`,
        body: `Ganaste ${pointsEarned.toLocaleString("es-AR")} puntos. Tu saldo: ${newBalance.toLocaleString("es-AR")} puntos.`,
        data: {
          type: "purchase_points",
          organizationId: organizationId || appUser.organization_id,
        },
      }));

      try {
        const result = await sendPushNotifications(messages);
        if (result.data) {
          for (let i = 0; i < result.data.length; i++) {
            const ticket = result.data[i];
            if (ticket.status === "ok") {
              pushSent++;
            } else {
              pushFailed++;
              if (ticket.details?.error === "DeviceNotRegistered") {
                await adminClient
                  .from("push_tokens")
                  .update({ is_active: false })
                  .eq("id", pushTokens[i].id);
              }
            }
          }
        }
      } catch {
        pushFailed = pushTokens.length;
      }
    }

    // --- Send email ---
    let emailSent = false;

    if (beneficiary.email) {
      const html = buildPurchaseEmailHtml({
        beneficiaryName,
        organizationName: orgName,
        pointsEarned,
        totalAmount,
        newBalance,
      });

      try {
        if (process.env.RESEND_API_KEY) {
          const { error: emailError } = await resend.emails.send({
            from: EMAIL_FROM,
            to: beneficiary.email,
            subject: `Ganaste ${pointsEarned.toLocaleString("es-AR")} puntos en ${orgName}`,
            html,
          });

          emailSent = !emailError;
          if (emailError) {
            console.error("[purchase/notify] Email error:", emailError);
          }
        } else {
          console.warn(
            "[purchase/notify] No RESEND_API_KEY set, skipping email"
          );
        }
      } catch (err) {
        console.error("[purchase/notify] Email error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      push: { sent: pushSent, failed: pushFailed },
      emailSent,
    });
  } catch (error) {
    console.error("[purchase/notify] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
