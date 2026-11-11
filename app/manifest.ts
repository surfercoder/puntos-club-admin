import type { MetadataRoute } from "next";

// Acceso directo del panel en el celular, igual que las dos webapps (ver
// InstallPrompt). Arranca en /dashboard: el proxy manda al login si no hay
// sesion. Chrome pide 192 y 512 para ofrecer la instalacion; los maskable traen
// el disco dentro de la zona segura para que Android lo recorte sin comerse el
// regalo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Puntos Club Panel",
    short_name: "Puntos Club",
    description: "Panel de administración de Puntos Club",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    lang: "es-AR",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
