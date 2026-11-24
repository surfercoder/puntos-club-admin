// Ficha publica de Google Play de la app de beneficiarios (en produccion desde 20/11/2026).
export const PUNTOS_CLUB_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.agustincassani.PuntosClub";

// Caja sigue en testing interno: los testers la bajan del APK de Drive hasta que
// tenga ficha publica. Entonces pasar a play.google.com/store/apps/details?id=com.agustincassani.PuntosClubCaja.
export const PUNTOS_CLUB_CAJA_APK_URL =
  "https://drive.google.com/file/d/1ohALzgEOYxCeb4AJYyEiFUm0xsTV-3B2/view?usp=drive_link";

// Las mismas apps en el navegador, para quien no tiene Android.
export const PUNTOS_CLUB_WEB_URL = "https://puntos-club-web.vercel.app";
export const PUNTOS_CLUB_CAJA_WEB_URL = "https://puntos-club-caja-web.vercel.app";

// Logo de cada app (el mismo que se publica en Google Play), para acompanar al QR.
export const PUNTOS_CLUB_LOGO = "/images/logos/app-puntosclub-v2.png";
export const PUNTOS_CLUB_CAJA_LOGO = "/images/logos/app-puntosclubcaja-v2.png";
