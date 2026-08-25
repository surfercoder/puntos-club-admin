// Placeholder plano de Clubi, la mascota. Los mockups usan renders 3D que el
// diseñador todavía no exportó; cuando lleguen los PNG se reemplaza este SVG.
export function Clubi({
  className,
  accent = "var(--brand-pink)",
}: {
  className?: string;
  accent?: string;
}) {
  return (
    <svg viewBox="0 0 120 130" aria-hidden="true" focusable="false" className={className}>
      {/* antena */}
      <line x1="60" y1="20" x2="60" y2="8" stroke={accent} strokeWidth="3" />
      <circle cx="60" cy="6" r="5" fill={accent} />
      {/* cabeza */}
      <rect x="26" y="18" width="68" height="52" rx="24" fill="#FFFFFF" />
      <rect x="34" y="26" width="52" height="36" rx="18" fill="#141425" />
      <circle cx="50" cy="43" r="4.5" fill={accent} />
      <circle cx="70" cy="43" r="4.5" fill={accent} />
      <path
        d="M52 52c2.6 2.6 5.4 3.9 8 3.9s5.4-1.3 8-3.9"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* orejeras */}
      <rect x="18" y="34" width="10" height="20" rx="5" fill={accent} />
      <rect x="92" y="34" width="10" height="20" rx="5" fill={accent} />
      {/* capa */}
      <path d="M34 74c-8 14-10 30-8 44l24-16Z" fill={accent} opacity="0.85" />
      <path d="M86 74c8 14 10 30 8 44l-24-16Z" fill={accent} opacity="0.85" />
      {/* cuerpo */}
      <rect x="34" y="70" width="52" height="46" rx="22" fill="#FFFFFF" />
      <circle cx="60" cy="92" r="13" fill={accent} />
      <rect x="52" y="86" width="16" height="12" rx="2" fill="#FFFFFF" />
      <rect x="58" y="86" width="4" height="12" fill={accent} />
      {/* brazos */}
      <rect x="18" y="74" width="12" height="26" rx="6" fill="#FFFFFF" />
      <rect x="90" y="66" width="12" height="26" rx="6" fill="#FFFFFF" transform="rotate(20 96 79)" />
    </svg>
  );
}
