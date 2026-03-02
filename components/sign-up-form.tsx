"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signUpAdmin } from "@/actions/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SignUpSchema } from "@/schemas/auth.schema";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = SignUpSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      repeatPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const signUpResult = await signUpAdmin({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      if (!signUpResult.success) {
        setError(signUpResult.error || "Ocurrió un error");
        return;
      }

      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Registrarse</CardTitle>
          <CardDescription>Crear una nueva cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    type="text"
                    value={firstName}
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby="firstName-error"
                  />
                  {fieldErrors.firstName && (
                    <p id="firstName-error" className="text-destructive text-sm">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="García"
                    type="text"
                    value={lastName}
                    aria-invalid={!!fieldErrors.lastName}
                    aria-describedby="lastName-error"
                  />
                  {fieldErrors.lastName && (
                    <p id="lastName-error" className="text-destructive text-sm">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@ejemplo.com"
                  type="email"
                  value={email}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby="email-error"
                />
                {fieldErrors.email && (
                  <p id="email-error" className="text-destructive text-sm">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  value={password}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby="password-error"
                />
                {fieldErrors.password && (
                  <p id="password-error" className="text-destructive text-sm">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repetir contraseña</Label>
                <Input
                  id="repeat-password"
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  type="password"
                  value={repeatPassword}
                  aria-invalid={!!fieldErrors.repeatPassword}
                  aria-describedby="repeatPassword-error"
                />
                {fieldErrors.repeatPassword && (
                  <p id="repeatPassword-error" className="text-destructive text-sm">
                    {fieldErrors.repeatPassword}
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? "Creando cuenta..." : "Registrarse"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link className="underline underline-offset-4" href="/auth/login">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
