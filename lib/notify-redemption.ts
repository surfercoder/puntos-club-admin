import { pushToBeneficiary, type PushResult } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";

// Aviso de canje resuelto. Lo disparan los dos lugares donde el personal de la
// organizacion entrega o cancela —la app de cajero (POST /api/redemption/notify)
// y el dashboard (deliverRedemption / cancelRedemption)—, nunca el beneficiario:
// avisarle de algo que acaba de hacer el mismo es ruido.
// ponytail: push solo, sin mail. El mail de puntos existe porque ya habia
// plantilla; si hace falta una de canje, se agrega a lib/email-template.ts.

const one = <T,>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

/**
 * Avisa al beneficiario que su canje se entrego o se cancelo. El estado sale de
 * la fila, no del que llama: asi el texto no puede contradecir a la base.
 * Devuelve `null` si el canje no existe o quedo en un estado que no se avisa.
 */
export async function notifyRedemptionResolved(
  redemptionId: number | string
): Promise<PushResult | null> {
  // Admin client: el cajero no ve al beneficiario de otra organizacion.
  const adminClient = createAdminClient();

  const { data: redemption } = await adminClient
    .from("redemption")
    .select(
      "id, beneficiary_id, organization_id, points_used, status, product:product_id(name), organization:organization_id(name)"
    )
    .eq("id", redemptionId)
    .single();

  if (!redemption) return null;
  if (redemption.status !== "delivered" && redemption.status !== "cancelled") {
    return null;
  }

  const orgName = one(redemption.organization)?.name || "la tienda";
  const productName = one(redemption.product)?.name || "tu premio";
  const points = (redemption.points_used ?? 0).toLocaleString("es-AR");

  const message =
    redemption.status === "delivered"
      ? {
          title: `Retiraste ${productName} en ${orgName}`,
          body: `Ya te entregamos ${productName}. Usaste ${points} puntos.`,
        }
      : {
          title: `Se canceló tu canje en ${orgName}`,
          body: `Cancelamos el canje de ${productName} y te devolvimos ${points} puntos.`,
        };

  return pushToBeneficiary(redemption.beneficiary_id, {
    ...message,
    data: {
      type: "redemption",
      status: redemption.status,
      organizationId: redemption.organization_id,
      redemptionId: redemption.id,
    },
  });
}
