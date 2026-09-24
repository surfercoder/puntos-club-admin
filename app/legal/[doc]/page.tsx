import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PRIVACY_TEXT, PRIVACY_VERSION, TERMS_TEXT, TERMS_VERSION } from "@/lib/legal";

// Los documentos legales publicos. Google Play exige que la Politica de
// Privacidad viva en una URL publica y estable: es la que se declara en la
// ficha de la app, y la Data Safety se contrasta contra ella.
//
// El texto sale de lib/legal.ts, que es copia del que las apps muestran en el
// alta. No reescribir aca: si cambia, cambia en los tres proyectos a la vez.
const DOCS = {
  privacidad: {
    title: "Política de Privacidad",
    text: PRIVACY_TEXT,
    version: PRIVACY_VERSION,
  },
  terminos: {
    title: "Términos y Condiciones",
    text: TERMS_TEXT,
    version: TERMS_VERSION,
  },
} as const;

type Doc = keyof typeof DOCS;

const isDoc = (value: string): value is Doc => value in DOCS;

// Rutas conocidas: se prerenderizan las dos y cualquier otra da 404.
export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  if (!isDoc(doc)) return {};
  return {
    title: `${DOCS[doc].title} | Puntos Club`,
    description: `${DOCS[doc].title} de Puntos Club, operado por ADAMANTIO SAS.`,
  };
}

// Una linea del documento: encabezado ("## "), item ("- ") o parrafo suelto.
// Mismo mini-formato que usan las apps, para no meter un parser de markdown.
function LegalLine({ line }: { line: string }) {
  if (line.startsWith("## ")) {
    return (
      <h2 className="mt-8 mb-2 text-lg font-semibold tracking-tight">
        {line.slice(3)}
      </h2>
    );
  }
  if (line.startsWith("- ")) {
    return (
      <li className="ml-5 list-disc text-sm leading-6 text-muted-foreground">
        {line.slice(2)}
      </li>
    );
  }
  return <p className="mb-3 text-sm leading-6 text-muted-foreground">{line}</p>;
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!isDoc(doc)) notFound();

  const { title, text, version } = DOCS[doc];
  // Las dos primeras lineas del documento son el nombre y el titulo, que ya
  // estan en el encabezado de la pagina: se saltean para no repetirlos.
  const lines = text.split("\n").slice(2);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Puntos Club · Versión {version}
      </p>
      {lines.map((line, i) => (
        <LegalLine key={`l${i}`} line={line} />
      ))}
    </article>
  );
}
