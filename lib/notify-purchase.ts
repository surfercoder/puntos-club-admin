import * as Sentry from "@sentry/nextjs";

import { pointsCreditedEmail } from "@/lib/email-template";
import { pushToBeneficiary, type PushResult } from "@/lib/push";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

// Aviso de puntos acreditados: push + mail. Vive aca y no en la route porque
// hay dos cajas que cargan puntos —la app de cajero (POST /api/purchase/notify)
// y la caja virtual del dashboard (purchaseFormAction)— y solo la primera
// avisaba. Cualquier alta de `purchase` nueva tiene que pasar por aca.

export type PointsCreditedResult = {
  push: PushResult;
  emailSent: boolean;
};

/**
 * Avisa al beneficiario que se le acreditaron puntos. Best-effort: devuelve
 * `null` si el beneficiario no existe y nunca tira — una notificacion que falla
 * no puede voltear la venta que ya se guardo.
 */
export async function notifyPointsCredited(params: {
  beneficiaryId: number | string;
  organizationId: number | string;
  pointsEarned: number;
}): Promise<PointsCreditedResult | null> {
  const { beneficiaryId, organizationId, pointsEarned } = params;

  // Admin client para saltear RLS en los cruces entre tablas.
  const adminClient = createAdminClient();

  const { data: beneficiary } = await adminClient
    .from("beneficiary")
    .select("id, first_name, last_name, email")
    .eq("id", beneficiaryId)
    .single();

  if (!beneficiary) return null;

  const { data: organization } = await adminClient
    .from("organization")
    .select("name, logo_url")
    .eq("id", organizationId)
    .single();

  const orgName = organization?.name || "la tienda";

  const { data: beneficiaryOrg } = await adminClient
    .from("beneficiary_organization")
    .select("available_points")
    .eq("beneficiary_id", beneficiaryId)
    .eq("organization_id", organizationId)
    .single();

  const newBalance = beneficiaryOrg?.available_points ?? pointsEarned;
  const beneficiaryName =
    `${beneficiary.first_name || ""} ${beneficiary.last_name || ""}`.trim() ||
    "Cliente";

  const push = await pushToBeneficiary(beneficiaryId, {
    title: `+${pointsEarned.toLocaleString("es-AR")} puntos en ${orgName}`,
    body: `Ganaste ${pointsEarned.toLocaleString("es-AR")} puntos. Tu saldo: ${newBalance.toLocaleString("es-AR")} puntos.`,
    data: {
      type: "purchase_points",
      organizationId,
    },
  });

  // --- Mail ---
  let emailSent = false;

  if (beneficiary.email) {
    const html = pointsCreditedEmail({
      beneficiaryName,
      organizationName: orgName,
      organizationLogoUrl: organization?.logo_url,
      pointsEarned,
      newBalance,
      accreditedAt: new Date(),
    });

    try {
      if (process.env.RESEND_API_KEY) {
        const { error: emailError } = await resend.emails.send({
          from: EMAIL_FROM,
          to: beneficiary.email,
          subject: `¡Se acreditaron +${pointsEarned.toLocaleString("es-AR")} puntos en tu cuenta!`,
          html,
        });

        emailSent = !emailError;
        if (emailError) {
          console.error("[purchase/notify] Email error:", emailError);
          Sentry.captureException(emailError, {
            tags: { area: "purchase.notify.email" },
          });
        }
      } else {
        console.warn("[purchase/notify] No RESEND_API_KEY set, skipping email");
      }
    } catch (err) {
      console.error("[purchase/notify] Email error:", err);
      Sentry.captureException(err, {
        tags: { area: "purchase.notify.email" },
      });
    }
  }

  return { push, emailSent };
}
