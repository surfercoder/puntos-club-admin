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
            <td style="background:${BRAND.dark};padding:28px 36px;text-align:center">
              <span style="font-family:'Poppins',Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:${BRAND.white}">
                Puntos
              </span>
              <span style="font-family:'Poppins',Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:${BRAND.pink}">
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
