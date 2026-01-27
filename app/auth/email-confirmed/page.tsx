import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function EmailConfirmedPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">
                Cuenta confirmada
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Tu cuenta fue confirmada exitosamente. ¡Bienvenido/a a PuntosClub! Ya puedes iniciar sesión y empezar a usar la app.
              </p>
              <Button asChild className="w-full">
                <Link href="puntosclub://">
                  Abrir PuntosClub
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Si el boton no funciona, abre la app manualmente desde tu dispositivo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
