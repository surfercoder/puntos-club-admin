// Ilustración decorativa del hero del dashboard: regalo sobre círculo azul con
// destellos. Va inline para no depender de un asset todavía inexistente.
export function GiftIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="80" cy="60" r="46" fill="var(--brand-blue)" />
      <rect x="52" y="56" width="56" height="36" rx="5" fill="#F8B93F" />
      <rect x="52" y="48" width="56" height="14" rx="4" fill="#FFD166" />
      <rect x="73" y="48" width="14" height="44" fill="var(--brand-pink)" />
      <path
        d="M80 48c-8-12-20-12-20-4 0 5 9 6 20 4Zm0 0c8-12 20-12 20-4 0 5-9 6-20 4Z"
        fill="var(--brand-pink)"
      />
      <g fill="var(--brand-pink)" opacity="0.9">
        <path d="m24 34 2.2 5.3L31.5 42l-5.3 2.2L24 49.5 21.8 44 16.5 42l5.3-2.2Z" />
        <path d="m138 26 1.7 4 4 1.7-4 1.7-1.7 4-1.7-4-4-1.7 4-1.7Z" />
        <path d="m132 88 1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4Z" />
        <path d="m34 92 1.4 3.4 3.4 1.4-3.4 1.4L34 102l-1.4-3.4-3.4-1.4 3.4-1.4Z" />
      </g>
      <g fill="var(--brand-blue)" opacity="0.55">
        <circle cx="18" cy="70" r="3.5" />
        <circle cx="145" cy="62" r="4" />
        <circle cx="120" cy="16" r="3" />
      </g>
    </svg>
  );
}
