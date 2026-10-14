// Evento para GTM. Si GTM no esta cargado queda en un array que nadie lee.
export function trackEvent(event: string) {
  const w = window as Window & { dataLayer?: object[] };
  (w.dataLayer ??= []).push({ event });
}
