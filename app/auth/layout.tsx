import type { Metadata } from "next";

import { PublicHeader } from "@/components/public-header";

// Login, recuperacion y confirmaciones no tienen nada que buscar en Google.
export const metadata: Metadata = { robots: { index: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex flex-1">{children}</main>
    </div>
  );
}
