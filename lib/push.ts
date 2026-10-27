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

type TokenRow = { id: number; expo_push_token: string };

type AdminClient = ReturnType<typeof createAdminClient>;

// Expo acepta hasta 100 mensajes por request.
const EXPO_CHUNK_SIZE = 100;

/**
 * Manda el mismo push a cada token, en lotes de 100, y da de baja los que Expo
 * rechaza con DeviceNotRegistered. Nunca tira: un lote caido cuenta como fallido.
 */
async function deliver(
  adminClient: AdminClient,
  tokens: TokenRow[],
  message: PushMessage
): Promise<PushResult> {
  const results = await Promise.all(
    Array.from({ length: Math.ceil(tokens.length / EXPO_CHUNK_SIZE) }, async (_, c) => {
      const chunk = tokens.slice(c * EXPO_CHUNK_SIZE, (c + 1) * EXPO_CHUNK_SIZE);
      let sent = 0;
      let failed = 0;
      try {
        const result = await sendPushNotifications(
          chunk.map((t) => ({ to: t.expo_push_token, sound: "default" as const, ...message }))
        );
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
                deactivateIds.push(chunk[i].id);
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
        failed = chunk.length;
      }
      return { sent, failed };
    })
  );

  return results.reduce(
    (acc, r) => ({ sent: acc.sent + r.sent, failed: acc.failed + r.failed }),
    { sent: 0, failed: 0 }
  );
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

  return deliver(adminClient, pushTokens, message);
}

// PostgREST corta cada respuesta en 1000 filas.
const TOKEN_PAGE_SIZE = 1000;

/**
 * Comunicado del superadmin: un push a cada dispositivo activo de la
 * plataforma, sin importar a que organizaciones sigue el beneficiario.
 */
export async function pushToAllBeneficiaries(message: PushMessage): Promise<PushResult> {
  const adminClient = createAdminClient();
  const tokens: TokenRow[] = [];

  for (let from = 0; ; from += TOKEN_PAGE_SIZE) {
    const { data, error } = await adminClient
      .from("push_tokens")
      .select("id, expo_push_token")
      .eq("is_active", true)
      .order("id")
      .range(from, from + TOKEN_PAGE_SIZE - 1);
    if (error) throw error;
    tokens.push(...data);
    if (data.length < TOKEN_PAGE_SIZE) break;
  }

  // El mismo telefono no puede recibir el comunicado dos veces.
  const seen = new Set<string>();
  const unique = tokens.filter((t) => !seen.has(t.expo_push_token) && seen.add(t.expo_push_token));

  // ponytail: todo en una request; con decenas de miles de tokens pasar a una cola.
  return deliver(adminClient, unique, message);
}
