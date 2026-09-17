import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

// Unico emisor de push hacia un beneficiario. Los avisos (puntos acreditados,
// canjes) solo arman el texto: buscar los tokens, hablar con Expo y dar de baja
// los telefonos que ya no existen pasa siempre por aca.

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type PushResult = { sent: number; failed: number };

interface ExpoPushMessage extends PushMessage {
  to: string;
  sound?: "default";
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
    throw new AppError('notifications.sendFailed');
  }

  return response.json();
}

/**
 * Manda un push a todos los dispositivos activos del beneficiario. Nunca tira:
 * un push caido no puede voltear la operacion que ya se guardo.
 */
export async function pushToBeneficiary(
  beneficiaryId: number | string,
  message: PushMessage
): Promise<PushResult> {
  // Admin client: los tokens de otro usuario no pasan RLS.
  const adminClient = createAdminClient();

  const { data: pushTokens } = await adminClient
    .from("push_tokens")
    .select("id, expo_push_token")
    .eq("beneficiary_id", beneficiaryId)
    .eq("is_active", true);

  if (!pushTokens || pushTokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const messages: ExpoPushMessage[] = pushTokens.map((t) => ({
    to: t.expo_push_token,
    sound: "default" as const,
    ...message,
  }));

  let sent = 0;
  let failed = 0;

  try {
    const result = await sendPushNotifications(messages);
    if (result.data) {
      const deactivateIds: number[] = [];
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "ok") {
          sent++;
        } else {
          failed++;
          // El telefono desinstalo la app o revoco el permiso: el token no
          // vuelve a servir nunca mas.
          if (ticket.details?.error === "DeviceNotRegistered") {
            deactivateIds.push(pushTokens[i].id);
          }
        }
      }
      await Promise.all(
        deactivateIds.map((id) =>
          adminClient
            .from("push_tokens")
            .update({ is_active: false })
            .eq("id", id)
        )
      );
    }
  } catch {
    failed = pushTokens.length;
  }

  return { sent, failed };
}
