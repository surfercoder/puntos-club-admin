import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PRIVACY_TEXT, TERMS_TEXT } from "@/lib/legal";

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
  },
  terminos: {
    title: "Términos y Condiciones",
    text: TERMS_TEXT,
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

  const { title, text } = DOCS[doc];
  // Las dos primeras lineas son el nombre y el titulo del documento, que ya
  // salen en el <h1>. La version y la fecha de vigencia (lineas 3 y 4) SI se
  // dejan: las escribe el propio documento y en los T&C avisan que siguen
  // siendo un borrador, asi que taparlas seria esconder la advertencia.
  const lines = text.split("\n").slice(2);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">{title}</h1>
      {/* Key por contenido: no hay lineas repetidas y lo cubre el test. */}
      {lines.map((line) => (
        <LegalLine key={line} line={line} />
      ))}
    </article>
  );
}
