import Image from "next/image";

// Clubi, la mascota: el mismo render con alfa que usa la home de puntos-club-web.
export function Clubi({ className }: { className?: string }) {
  return (
    <Image
      src="/images/clubi.png"
      alt=""
      aria-hidden="true"
      width={542}
      height={569}
      className={`object-contain ${className ?? ""}`}
    />
  );
}
