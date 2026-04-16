import { PublicHeader } from "@/components/public-header";

export default function MobileAppsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
