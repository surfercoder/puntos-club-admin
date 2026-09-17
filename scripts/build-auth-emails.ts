/**
 * Genera los templates de los mails de Supabase Auth (GoTrue) en español y con
 * nuestro branding, reusando el layout de `lib/email-template.ts`.
 *
 *   npx tsx scripts/build-auth-emails.ts
 *
 * Los .html que salen a `supabase/templates/` los usa el stack local (ver
 * `[auth.email.template.*]` en supabase/config.toml) y hay que pegarlos a mano
 * en Dashboard → Authentication → Emails del proyecto hosted: GoTrue no lee
 * estos archivos en la nube.
 *
 * Están los 6 templates que ofrece el Dashboard. Los que el producto usa hoy son
 * confirmation, recovery y email_change; invite, magic_link y reauthentication
 * van igual para que ningún mail pueda salir con el default inglés de Supabase.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  brandedEmailLayout,
  ctaButton,
  noticeBox,
  sectionHeading,
} from '../lib/email-template';

/** Placeholder que GoTrue reemplaza por el link con el token. */
const URL_TOKEN = '{{ .ConfirmationURL }}';

const P = (html: string) =>
  `<p style="font-family:'Lexend',Arial,sans-serif;font-size:15px;color:#374151;margin:0 0 12px;line-height:1.7">${html}</p>`;

/** Footer con el link en texto plano: el botón se rompe en varios clientes. */
const footerWithLink = `
  <p style="margin:0 0 4px;font-size:13px;color:#6B7280;font-family:'Lexend',Arial,sans-serif">
    🔗 Si el botón no funciona, copiá y pegá este enlace en tu navegador:
  </p>
  <p style="margin:0 0 16px;font-size:11px;word-break:break-all">
    <a href="${URL_TOKEN}" style="color:#31A1D6">${URL_TOKEN}</a>
  </p>
  <p style="margin:0;font-size:12px;color:#6B7280;font-family:'Lexend',Arial,sans-serif">
    © ${new Date().getFullYear()} Puntos Club. Todos los derechos reservados.
  </p>`;

/** Caja con el código de 6 dígitos: `{{ .Token }}`, el único mail que no lleva link. */
const codeBox = (token: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0">
    <tr>
      <td align="center" style="background:#FFF5F5;border:1px solid #E8E0DE;border-radius:10px;padding:22px 16px">
        <p style="margin:0 0 8px;font-family:'Lexend',Arial,sans-serif;font-size:13px;color:#6B7280">Tu código de verificación</p>
        <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:38px;font-weight:700;letter-spacing:6px;color:#FF4573">${token}</p>
      </td>
    </tr>
  </table>`;

const templates = {
  // Alta del beneficiario (app): supabase.auth.signUp con "Confirm email" prendido.
  confirmation: `
    ${sectionHeading('¡Bienvenido a Puntos Club! 👋')}
    ${P('Estás a un paso de empezar a sumar puntos con cada compra.')}
    ${P('Confirmá tu dirección de email para activar tu cuenta.')}
    ${ctaButton(URL_TOKEN, 'Confirmar mi email')}
    ${P('Si no creaste esta cuenta, podés ignorar este mensaje sin problema.')}`,

  // resetPasswordForEmail desde las 3 apps (admin web, beneficiario y caja).
  recovery: `
    ${sectionHeading('Restablecé tu contraseña 🔑')}
    ${P('Recibimos un pedido para cambiar la contraseña de tu cuenta de Puntos Club.')}
    ${P('Tocá el botón para elegir una nueva:')}
    ${ctaButton(URL_TOKEN, 'Crear nueva contraseña')}
    ${noticeBox(
      '🔒',
      '¿No fuiste vos?',
      'Ignorá este mensaje: tu contraseña actual sigue funcionando y nadie puede cambiarla sin este enlace.',
    )}`,

  // profile-form.tsx → updateUser({ email }); con double_confirm_changes llega a las dos casillas.
  email_change: `
    ${sectionHeading('Confirmá tu nuevo email ✉️')}
    ${P('Pediste cambiar el email de tu cuenta de <strong style="color:#1A1A2E">{{ .Email }}</strong> a <strong style="color:#1A1A2E">{{ .NewEmail }}</strong>.')}
    ${P('Confirmá el cambio para que empecemos a usar la dirección nueva:')}
    ${ctaButton(URL_TOKEN, 'Confirmar el cambio')}
    ${P('Si no pediste este cambio, ignorá este mensaje y tu email queda como está.')}`,
  // No lo usamos: el alta del owner manda su propio mail por Resend. Va por si
  // alguien invita desde el Dashboard.
  invite: `
    ${sectionHeading('Te invitaron a Puntos Club 🎉')}
    ${P('Alguien de tu equipo te invitó a crear tu cuenta en <strong style="color:#1A1A2E">Puntos Club</strong>.')}
    ${P('Aceptá la invitación para elegir tu contraseña y empezar:')}
    ${ctaButton(URL_TOKEN, 'Aceptar la invitación')}
    ${P('Si no esperabas esta invitación, podés ignorar este mensaje.')}`,

  // No lo usamos: entramos con email y contraseña, no con link mágico.
  magic_link: `
    ${sectionHeading('Tu enlace de acceso 🔑')}
    ${P('Pediste entrar a Puntos Club sin escribir tu contraseña. Tocá el botón y listo:')}
    ${ctaButton(URL_TOKEN, 'Entrar a Puntos Club')}
    ${noticeBox(
      '🔒',
      'No compartas este enlace',
      'Cualquiera que lo abra entra a tu cuenta. Si no lo pediste, ignorá este mensaje.',
    )}`,

  // No lo usamos: `secure_password_change` está apagado.
  reauthentication: `
    ${sectionHeading('Confirmá que sos vos 🛡️')}
    ${P('Para completar esta operación necesitamos verificar tu identidad. Ingresá este código en la app:')}
    ${codeBox('{{ .Token }}')}
    ${P('El código sirve una sola vez. Si no estabas haciendo nada en Puntos Club, cambiá tu contraseña por precaución.')}`,
} as const;

const subjects: Record<keyof typeof templates, string> = {
  confirmation: 'Confirmá tu email - Puntos Club',
  recovery: 'Restablecé tu contraseña - Puntos Club',
  email_change: 'Confirmá tu nuevo email - Puntos Club',
  invite: 'Te invitaron a Puntos Club',
  magic_link: 'Tu enlace de acceso - Puntos Club',
  reauthentication: 'Tu código de verificación - Puntos Club',
};

const outDir = join(__dirname, '..', 'supabase', 'templates');

for (const [name, body] of Object.entries(templates)) {
  const usesCode = name === 'reauthentication';
  const html = brandedEmailLayout(body, usesCode ? undefined : footerWithLink);

  // Un template sin placeholder es un mail sin link (o sin código): flujo muerto.
  const needle = usesCode ? '{{ .Token }}' : URL_TOKEN;
  if (!html.includes(needle)) throw new Error(`${name}: falta ${needle}`);
  if (/[Rr]eset your|[Cc]onfirm your/.test(html)) throw new Error(`${name}: quedó texto en inglés`);

  // Sin imágenes remotas: los clientes de mail las bloquean por default (y el
  // preview del Dashboard también), así que cualquier <img> es un cuadradito
  // roto esperando a pasar. El header va en texto.
  if (/<img\s/.test(html)) throw new Error(`${name}: sacá la imagen, no se ve en el mail`);

  const file = join(outDir, `${name.replace('_', '-')}.html`);
  writeFileSync(file, html);
  console.warn(`${file}\n  subject: ${subjects[name as keyof typeof templates]}`);
}
