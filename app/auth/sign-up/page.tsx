import type { Metadata } from "next";

import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = {
  title: "Registrarse - Puntos Club Admin",
  description: "Crear una nueva cuenta de administrador",
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
