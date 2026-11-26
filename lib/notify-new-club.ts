import * as Sentry from '@sentry/nextjs';
import { brandedEmailLayout, dataTable, esc, sectionHeading, subtitle } from '@/lib/email-template';

/** Quienes hacen el seguimiento de postventa de cada club nuevo. */
export const NEW_CLUB_RECIPIENTS = ['acassani@puntosclub.com.ar', 'cjschmidt@puntosclub.com.ar'];

export interface NewClubInfo {
  ownerName: string;
  ownerEmail: string;
  orgName: string;
  businessName?: string;
  taxId?: string;
  industry?: string;
  plan: string;
  branchName: string;
  phone?: string;
  address: string;
}

/**
 * Aviso interno de alta de club. Nunca tira: corre en after() y si falla
 * el alta ya está hecha, solo queda en Sentry.
 */
export async function notifyNewClub(info: NewClubInfo): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('\n📧  [DEV] Nuevo club (no RESEND_API_KEY set):', JSON.stringify(info, null, 2), '\n');
    return;
  }

  const mail = esc(info.ownerEmail);
  const rows = [
    { label: 'Dueño', value: esc(info.ownerName || '—') },
    { label: 'Email', value: `<a href="mailto:${mail}" style="color:#FD7E14;text-decoration:none">${mail}</a>` },
    { label: 'Teléfono', value: info.phone ? `<a href="tel:${esc(info.phone)}" style="color:#FD7E14;text-decoration:none">${esc(info.phone)}</a>` : '—' },
    { label: 'Club', value: esc(info.orgName) },
    { label: 'Razón social', value: esc(info.businessName || '—') },
    { label: 'CUIT', value: esc(info.taxId || '—') },
    { label: 'Rubro', value: esc(info.industry || '—') },
    { label: 'Plan', value: esc(info.plan) },
    { label: 'Sucursal', value: esc(info.branchName) },
    { label: 'Dirección', value: esc(info.address) },
  ];

  const html = brandedEmailLayout(`
    ${sectionHeading('Nuevo club en Puntos Club')}
    ${subtitle('Un dueño terminó el onboarding. Estos son sus datos para contactarlo.')}
    ${dataTable(rows)}
  `);

  // Import diferido: lib/resend construye el cliente al cargar y sin key tira,
  // lo que rompería la carga de las actions de onboarding.
  const { resend, EMAIL_FROM } = await import('@/lib/resend');
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: NEW_CLUB_RECIPIENTS,
      replyTo: info.ownerEmail,
      subject: `Nuevo club: ${info.orgName}`,
      html,
    });
    if (error) throw error;
  } catch (err) {
    console.error('[notifyNewClub] Resend error:', err);
    Sentry.captureException(err, { tags: { area: 'onboarding.new_club_email' }, extra: { orgName: info.orgName } });
  }
}
