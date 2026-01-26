import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

    if (!appUser?.organization_id) {
      return NextResponse.json(
        { success: false, error: "User not associated with an organization" },
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

    const { data: notification, error: notifError } = await supabase
      .from("push_notifications")
      .select("*")
      .eq("id", notificationId)
      .eq("organization_id", appUser.organization_id)
      .single();

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

    await supabase
      .from("push_notifications")
      .update({ status: 'sending' })
      .eq("id", notificationId);

    const { data: beneficiaryOrgs } = await supabase
      .from("beneficiary_organization")
      .select(`
        beneficiary_id,
        beneficiary:beneficiary(
          id,
          first_name,
          last_name
        )
      `)
      .eq("organization_id", appUser.organization_id)
      .eq("is_active", true);

    if (!beneficiaryOrgs || beneficiaryOrgs.length === 0) {
      await supabase
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

    const { data: pushTokens } = await supabase
      .from("push_tokens")
      .select("*")
      .in("beneficiary_id", beneficiaryIds)
      .eq("is_active", true);

    if (!pushTokens || pushTokens.length === 0) {
      await supabase
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
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);

      try {
        const result = await sendPushNotifications(chunk);

        if (result.data) {
          for (let j = 0; j < result.data.length; j++) {
            const ticketResult = result.data[j];
            const tokenIndex = i + j;
            const token = pushTokens[tokenIndex];

            if (ticketResult.status === 'ok') {
              sentCount++;
            } else {
              failedCount++;

              if (ticketResult.details?.error === 'DeviceNotRegistered') {
                await supabase
                  .from("push_tokens")
                  .update({ is_active: false })
                  .eq("id", token.id);
              }
            }
          }
        }
      } catch (_error) {
        failedCount += chunk.length;
      }
    }

    await supabase
      .from("push_notifications")
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
      })
      .eq("id", notificationId);

    await supabase.rpc('increment_notification_counters', {
      org_id: appUser.organization_id,
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
