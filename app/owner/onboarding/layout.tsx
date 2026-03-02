import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro de Propietario - Puntos Club',
  description:
    'Crea tu cuenta como propietario de negocio en Puntos Club. Configura tu organización, productos y empieza a fidelizar a tus clientes con puntos de recompensa.',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              PC
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Puntos Club</span>
          </div>
          <a
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ¿Ya tienes cuenta? <span className="text-emerald-600 font-medium">Ingresar</span>
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
