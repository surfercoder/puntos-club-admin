import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkPlanLimit } from "@/lib/plans/usage";

interface ExpoPushMessage {
  to: string;
  sound?: 'default';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendPushNotifications(messages: ExpoPushMessage[]) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push service error: ${response.statusText}`);
  }

  return response.json();
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

    const role = Array.isArray(appUser?.role) ? appUser?.role[0] : appUser?.role;
    const userIsAdmin = role?.name === 'admin';

    if (!userIsAdmin && !appUser?.organization_id) {
      return NextResponse.json(
        { success: false, error: "User not associated with an organization" },
        { status: 403 }
      );
    }

    if (!role || !['owner', 'admin'].includes(role.name)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can send notifications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "notificationId is required" },
        { status: 400 }
      );
    }

    // Use admin client so admins can look up notifications across all orgs
    const dbClient = userIsAdmin ? createAdminClient() : supabase;

    let notificationQuery = dbClient
      .from("push_notifications")
      .select("*")
      .eq("id", notificationId);

    // Non-admins are restricted to their own organization's notifications
    if (!userIsAdmin && appUser?.organization_id) {
      notificationQuery = notificationQuery.eq("organization_id", appUser.organization_id);
    }

    const { data: notification, error: notifError } = await notificationQuery.single();

    if (notifError || !notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.status === 'sent') {
      return NextResponse.json(
        { success: false, error: "Notification already sent" },
        { status: 400 }
      );
    }

    // Enforce monthly push notification quota
    const limitResult = await checkPlanLimit(
      notification.organization_id as number,
      'push_notifications_monthly'
    );

    if (limitResult && !limitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Has alcanzado el límite de notificaciones mensuales (${limitResult.current_usage}/${limitResult.limit_value}) para tu plan ${limitResult.plan}. Actualiza tu plan para continuar.`,
          limit: limitResult,
        },
        { status: 429 }
      );
    }

    await dbClient
      .from("push_notifications")
      .update({ status: 'sending' })
      .eq("id", notificationId);

    const { data: beneficiaryOrgs } = await dbClient
      .from("beneficiary_organization")
      .select(`
        beneficiary_id,
        beneficiary:beneficiary(
          id,
          first_name,
          last_name
        )
      `)
      .eq("organization_id", notification.organization_id)
      .eq("is_active", true);

    if (!beneficiaryOrgs || beneficiaryOrgs.length === 0) {
      await dbClient
        .from("push_notifications")
        .update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 })
        .eq("id", notificationId);

      return NextResponse.json({
        success: true,
        message: "No active beneficiaries to send to",
        sent: 0,
      });
    }

    const beneficiaryIds = beneficiaryOrgs.map(bo => bo.beneficiary_id);

    const { data: pushTokens } = await dbClient
      .from("push_tokens")
      .select("*")
      .in("beneficiary_id", beneficiaryIds)
      .eq("is_active", true);

    if (!pushTokens || pushTokens.length === 0) {
      await dbClient
        .from("push_notifications")
        .update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 })
        .eq("id", notificationId);

      return NextResponse.json({
        success: true,
        message: "No push tokens found for beneficiaries",
        sent: 0,
      });
    }

    const messages: ExpoPushMessage[] = pushTokens.map(token => ({
      to: token.expo_push_token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        organizationId: notification.organization_id,
        url: '/(tabs)',
      },
    }));

    const chunkSize = 100;
    const chunks: { chunk: ExpoPushMessage[]; offset: number }[] = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push({ chunk: messages.slice(i, i + chunkSize), offset: i });
    }

    // Send all chunks concurrently instead of serializing the awaits.
    const chunkResults = await Promise.all(
      chunks.map(async ({ chunk, offset }) => {
        try {
          const result = await sendPushNotifications(chunk);

          let sent = 0;
          let failed = 0;
          const deactivateIds: number[] = [];

          if (result.data) {
            for (let j = 0; j < result.data.length; j++) {
              const ticketResult = result.data[j];
              const token = pushTokens[offset + j];

              if (ticketResult.status === 'ok') {
                sent++;
              } else {
                failed++;

                if (ticketResult.details?.error === 'DeviceNotRegistered') {
                  deactivateIds.push(token.id);
                }
              }
            }
          }

          await Promise.all(
            deactivateIds.map((id) =>
              dbClient
                .from("push_tokens")
                .update({ is_active: false })
                .eq("id", id)
            )
          );

          return { sent, failed };
        } catch (_error) {
          return { sent: 0, failed: chunk.length };
        }
      })
    );

    const sentCount = chunkResults.reduce((acc, r) => acc + r.sent, 0);
    const failedCount = chunkResults.reduce((acc, r) => acc + r.failed, 0);

    await dbClient
      .from("push_notifications")
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
      })
      .eq("id", notificationId);

    await dbClient.rpc('increment_notification_counters', {
      org_id: notification.organization_id,
    });

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: messages.length,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
