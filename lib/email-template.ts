/**
 * Shared branded email template for Puntos Club.
 *
 * Brand palette:
 *   Pink    #FF4573
 *   Blue    #31A1D6
 *   Orange  #FD7E14
 *   Green   #4BB562
 *   Dark    #1A1A2E
 *
 * Fonts: Poppins (headings) / Lexend (body) via Google Fonts — degrades
 * gracefully to system sans-serif in clients that block remote fonts.
 */

/**
 * Escapa texto que viene de la base (nombres, razón social, URLs de logo) antes de
 * interpolarlo. Sin esto una comilla en un `src` o un `<` en un nombre inyecta
 * markup en el email. Los helpers de abajo reciben HTML a propósito, así que el
 * escape va en el valor, no en el helper.
 */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Las imágenes de un email tienen que ser absolutas: no hay página que resuelva rutas relativas. */
const EMAIL_BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.puntosclub.com.ar'
).replace(/\/+$/, '');

const BRAND = {
  pink: '#FF4573',
  blue: '#31A1D6',
  orange: '#FD7E14',
  green: '#4BB562',
  dark: '#1A1A2E',
  muted: '#6B7280',
  border: '#E8E0DE',
  surface: '#FFF5F5',
  white: '#FFFFFF',
} as const;

/** Gradient bar rendered as a set of table cells (works in most clients). */
const GRADIENT_BAR = `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="background:${BRAND.orange};height:4px;width:33%"></td>
      <td style="background:${BRAND.pink};height:4px;width:34%"></td>
      <td style="background:${BRAND.blue};height:4px;width:33%"></td>
    </tr>
  </table>`;

/** Outer wrapper that all email types share. */
export function brandedEmailLayout(body: string, footer?: string): string {
  const footerContent =
    footer ??
    `<p style="margin:0;font-size:12px;color:${BRAND.muted}">
      © ${new Date().getFullYear()} Puntos Club. Todos los derechos reservados.
    </p>`;

  return /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Lexend:wght@300;400;700&display=swap"
    rel="stylesheet"
  />
  <!--[if mso]>
  <style>
    body, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Lexend',Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F3F4F6;padding:32px 16px">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

          <!-- Gradient bar -->
          <tr><td>${GRADIENT_BAR}</td></tr>

          <!-- Header -->
          <tr>
            <td style="background:${BRAND.dark};padding:24px 36px;text-align:center">
              <img src="${EMAIL_BASE_URL}/images/logos/LogoImage.png" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:50%;margin-right:10px" />
              <span style="font-family:'Poppins',Arial,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.3px;color:${BRAND.white};vertical-align:middle">
                Puntos
              </span>
              <span style="font-family:'Poppins',Arial,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.3px;color:${BRAND.pink};vertical-align:middle">
                Club
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;background:${BRAND.white};font-family:'Lexend',Arial,sans-serif;font-size:15px;color:${BRAND.dark};line-height:1.7">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 24px;background:${BRAND.surface};border-top:1px solid ${BRAND.border};text-align:center;font-family:'Lexend',Arial,sans-serif">
              ${footerContent}
            </td>
          </tr>

          <!-- Bottom gradient bar -->
          <tr><td>${GRADIENT_BAR}</td></tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** A branded CTA button. */
export function ctaButton(href: string, label: string, color = BRAND.pink): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0">
      <tr>
        <td style="border-radius:8px;background:${color}">
          <a
            href="${href}"
            style="display:inline-block;padding:14px 32px;font-family:'Poppins',Arial,sans-serif;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:8px;letter-spacing:0.2px"
          >${label}</a>
        </td>
      </tr>
    </table>`;
}

/** A section heading (h2 style). */
export function sectionHeading(text: string): string {
  return `<h2 style="font-family:'Poppins',Arial,sans-serif;font-size:20px;font-weight:700;color:${BRAND.dark};margin:0 0 6px">${text}</h2>`;
}

/** A subtle subtitle line. */
export function subtitle(text: string): string {
  return `<p style="font-family:'Lexend',Arial,sans-serif;font-size:13px;color:${BRAND.muted};margin:0 0 24px">${text}</p>`;
}

/** A labeled data table for key-value pairs. */
export function dataTable(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      ({ label, value }) => `
      <tr>
        <td style="padding:10px 14px;font-family:'Poppins',Arial,sans-serif;font-weight:600;font-size:13px;color:${BRAND.dark};border-bottom:1px solid ${BRAND.border};white-space:nowrap;width:130px;vertical-align:top">${label}</td>
        <td style="padding:10px 14px;font-family:'Lexend',Arial,sans-serif;font-size:14px;color:#374151;border-bottom:1px solid ${BRAND.border}">${value}</td>
      </tr>`
    )
    .join('');
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;margin:0 0 20px">
      ${cells}
    </table>`;
}

/** A message / content block with a light background. */
export function messageBox(label: string, content: string): string {
  return `
    <p style="font-family:'Poppins',Arial,sans-serif;font-weight:600;font-size:13px;color:${BRAND.dark};margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px">${label}</p>
    <div style="background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:8px;padding:16px 18px;margin:0 0 20px">
      <p style="font-family:'Lexend',Arial,sans-serif;font-size:14px;color:#374151;white-space:pre-wrap;margin:0;line-height:1.75">${content}</p>
    </div>`;
}

/** A badge-style type label. */
export function typeBadge(label: string, color: string = BRAND.blue): string {
  return `<span style="display:inline-block;background:${color}1A;color:${color};font-family:'Poppins',Arial,sans-serif;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:0.3px">${label}</span>`;
}

/**
 * Cuadrícula de beneficios del email de bienvenida. Va en tabla porque es lo
 * único que respetan de forma consistente Outlook y Gmail.
 */
export function benefitGrid(
  items: { emoji: string; title: string; description: string; color: string }[],
): string {
  const cell = ({ emoji, title, description, color }: (typeof items)[number]) => `
    <td width="50%" valign="top" style="padding:14px 12px">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom:10px">
            <div style="width:44px;height:44px;line-height:44px;border-radius:50%;background:${color}1A;font-size:20px;text-align:center">${emoji}</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:'Poppins',Arial,sans-serif;font-size:14px;font-weight:600;color:${BRAND.dark};padding-bottom:6px">${title}</td>
        </tr>
        <tr>
          <td align="center" style="font-family:'Lexend',Arial,sans-serif;font-size:12px;color:${BRAND.muted};line-height:1.6">${description}</td>
        </tr>
      </table>
    </td>`;

  const rows: string[] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(`<tr>${items.slice(index, index + 2).map(cell).join('')}</tr>`);
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0 8px;border-top:1px solid ${BRAND.border};border-bottom:1px solid ${BRAND.border}">
      ${rows.join('')}
    </table>`;
}

/** Aviso destacado, como el bloque de seguridad del email de bienvenida. */
export function noticeBox(
  emoji: string,
  title: string,
  description: string,
  color: string = BRAND.blue,
): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${color}0D;border-radius:10px;margin:20px 0">
      <tr>
        <td width="56" align="center" valign="top" style="padding:16px 0 16px 16px">
          <div style="width:40px;height:40px;line-height:40px;border-radius:50%;background:${color}1A;font-size:18px;text-align:center">${emoji}</div>
        </td>
        <td style="padding:16px">
          <p style="margin:0 0 4px;font-family:'Poppins',Arial,sans-serif;font-size:14px;font-weight:600;color:${color}">${title}</p>
          <p style="margin:0;font-family:'Lexend',Arial,sans-serif;font-size:12px;color:${BRAND.muted};line-height:1.6">${description}</p>
        </td>
      </tr>
    </table>`;
}

const SUPPORT_EMAIL = "soporte@puntosclub.com.ar";

const nf = (n: number) => n.toLocaleString("es-AR");

/** "25 de mayo de 2025 - 14:32 hs", en hora de Argentina. */
function formatAccreditedAt(date: Date): string {
  const opts: Intl.DateTimeFormatOptions = { timeZone: "America/Argentina/Buenos_Aires" };
  const day = date.toLocaleDateString("es-AR", { ...opts, day: "numeric", month: "long", year: "numeric" });
  const time = date.toLocaleTimeString("es-AR", { ...opts, hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} - ${time} hs`;
}

/** Círculo con emoji, el mismo recurso que usa benefitGrid: ningún cliente de mail necesita cargar un icono. */
function iconCircle(emoji: string, color: string): string {
  return `<div style="width:48px;height:48px;line-height:48px;border-radius:50%;background:${color}1A;font-size:22px;text-align:center">${emoji}</div>`;
}

/**
 * Email de acreditación de puntos (plantilla del ticket "Plantilla de acreditación al mail").
 */
export function pointsCreditedEmail(params: {
  beneficiaryName: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  pointsEarned: number;
  newBalance: number;
  accreditedAt: Date;
}): string {
  const {
    beneficiaryName,
    organizationName,
    organizationLogoUrl,
    pointsEarned,
    newBalance,
    accreditedAt,
  } = params;

  // Solo el nombre de pila: el saludo del mockup es "¡Buenísimo, Juan!".
  const firstName = esc(beneficiaryName.split(" ")[0]);
  const orgName = esc(organizationName);

  const orgMark = organizationLogoUrl
    ? `<img src="${esc(organizationLogoUrl)}" width="48" height="48" alt="" style="display:block;border:0;border-radius:50%;object-fit:cover" />`
    : iconCircle("🏬", BRAND.blue);

  const body = `
    <!-- Hero -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td width="58%" valign="top" style="padding-right:8px">
          <h1 style="margin:0 0 14px;font-family:'Poppins',Arial,sans-serif;font-size:27px;line-height:1.25;font-weight:700;color:${BRAND.dark}">
            ¡Buenísimo, ${firstName}! 🎉<br />Acabás de recibir<br /><span style="color:${BRAND.pink}">puntos</span> en tu cuenta
          </h1>
          <p style="margin:0 0 22px;font-size:14px;color:#4B5563;line-height:1.6">
            Tus compras te acercan a más beneficios.<br />¡Seguí así! 💗
          </p>

          <!-- Puntos acreditados -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#FFEFF3;border-radius:10px">
            <tr>
              <td align="center" style="padding:20px 16px">
                <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:15px;font-weight:600;color:${BRAND.pink}">Se acreditaron</p>
                <p style="margin:2px 0;font-family:'Poppins',Arial,sans-serif;font-size:52px;line-height:1.1;font-weight:700;color:${BRAND.pink}">+${nf(pointsEarned)}</p>
                <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:16px;font-weight:600;color:${BRAND.pink}">puntos</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="42%" valign="middle" align="right">
          <img src="${EMAIL_BASE_URL}/images/email/points-mascot.png" width="240" alt="" style="display:block;border:0;max-width:100%;height:auto" />
        </td>
      </tr>
    </table>

    <!-- Saldo + acreditado por -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:26px 0 0;border:1px solid #EEF0F4;border-radius:10px">
      <tr>
        <td width="50%" valign="top" style="padding:18px 20px;border-right:1px solid #EEF0F4">
          <p style="margin:0 0 10px;font-family:'Poppins',Arial,sans-serif;font-size:13px;font-weight:600;color:${BRAND.dark}">Tu saldo actual</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle" style="padding-right:12px">${iconCircle("⭐", BRAND.pink)}</td>
              <td valign="middle">
                <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:28px;line-height:1.1;font-weight:700;color:${BRAND.dark}">${nf(newBalance)}</p>
                <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:15px;font-weight:600;color:${BRAND.dark}">puntos</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" valign="top" style="padding:18px 20px">
          <p style="margin:0 0 10px;font-family:'Poppins',Arial,sans-serif;font-size:13px;font-weight:600;color:${BRAND.dark}">Acreditado por</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle" style="padding-right:12px">${orgMark}</td>
              <td valign="middle">
                <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:700;color:${BRAND.dark}">${orgName}</p>
                <p style="margin:2px 0 0;font-size:12px;color:${BRAND.muted}">${formatAccreditedAt(accreditedAt)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA catálogo -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 0;background:#F3F7FF;border-radius:10px">
      <tr>
        <td width="70" align="center" valign="middle" style="padding:18px 0 18px 18px">${iconCircle("🎁", BRAND.blue)}</td>
        <td valign="middle" style="padding:18px 12px">
          <p style="margin:0 0 3px;font-family:'Poppins',Arial,sans-serif;font-size:15px;font-weight:700;color:#1D6FE0">¡Estás cada vez más cerca de tus premios!</p>
          <p style="margin:0;font-size:13px;color:#4B5563">Revisá el catálogo y elegí tus recompensas favoritas.</p>
        </td>
        <td valign="middle" align="right" style="padding:18px 18px 18px 0">
          <a href="${EMAIL_BASE_URL}/" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#1D6FE0;font-family:'Poppins',Arial,sans-serif;font-size:14px;font-weight:600;color:#fff;text-decoration:none;white-space:nowrap">Ver catálogo &nbsp;›</a>
        </td>
      </tr>
    </table>

    <!-- Cómo funcionan -->
    <p style="margin:28px 0 0;font-family:'Poppins',Arial,sans-serif;font-size:16px;font-weight:700;color:${BRAND.dark}">Así funcionan tus puntos</p>
    ${benefitGrid([
      { emoji: "🛍️", title: "Comprá", description: "Sumás puntos por cada compra que realizás.", color: BRAND.pink },
      { emoji: "⭐", title: "Acumulá", description: "Los puntos se acreditan en tu cuenta.", color: BRAND.blue },
      { emoji: "🎁", title: "Canjeá", description: "Elegí tus premios cuando quieras.", color: BRAND.pink },
      { emoji: "😊", title: "Disfrutá", description: "Disfrutá los beneficios de ser parte de Puntos Club.", color: BRAND.blue },
    ])}

    <p style="margin:22px 0 0;text-align:center;font-size:13px;color:${BRAND.muted}">
      Si tenés dudas, escribinos a <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.pink};font-weight:600;text-decoration:none">${SUPPORT_EMAIL}</a> o desde la sección <strong style="color:${BRAND.dark}">Ayuda</strong> en la app.
    </p>
  `;

  return brandedEmailLayout(body);
}
