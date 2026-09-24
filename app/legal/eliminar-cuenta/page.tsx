import type { Metadata } from "next";
import Link from "next/link";

// Google Play exige que toda app que permita crear una cuenta ofrezca tambien
// borrarla, por dos caminos: uno dentro de la app y una URL publica que se
// pueda abrir SIN instalarla. Esta es esa URL; el camino in-app es la opcion
// "Eliminar mi cuenta" del perfil, que abre esta misma pagina.
//
// Es un pedido y no un borrado automatico a proposito: `purchase.beneficiary_id`
// es NOT NULL, asi que borrar la fila del beneficiario romperia las ventas
// registradas por los comercios. Lo que se hace es anonimizar al titular y
// conservar la operacion, que es lo que describe la seccion 25 de la Politica.
export const metadata: Metadata = {
  title: "Eliminar mi cuenta | Puntos Club",
  description:
    "Cómo solicitar la eliminación de tu cuenta de Puntos Club y qué datos se borran.",
};

const DPO = "dpo@puntosclub.com.ar";

const ASUNTO = "Solicitud de eliminación de cuenta";
const CUERPO = [
  "Hola,",
  "",
  "Solicito la eliminación de mi cuenta de Puntos Club.",
  "",
  "Email de la cuenta:",
  "Nombre y apellido:",
  "",
  "Entiendo que se eliminarán mis puntos en todos los programas.",
].join("\n");

const mailto = `mailto:${DPO}?subject=${encodeURIComponent(
  ASUNTO,
)}&body=${encodeURIComponent(CUERPO)}`;

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mb-6 ml-5 list-disc space-y-1.5">
      {items.map((item) => (
        <li key={item} className="text-sm leading-6 text-muted-foreground">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function EliminarCuentaPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        Eliminar mi cuenta
      </h1>

      <p className="mb-6 text-sm leading-6 text-muted-foreground">
        Podés pedir la eliminación de tu cuenta de Puntos Club cuando quieras,
        desde la aplicación o desde esta página. La solicitud la procesa
        ADAMANTIO SAS, responsable del tratamiento de tus datos.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold tracking-tight">
        Cómo pedirla
      </h2>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        Escribinos a{" "}
        <Link href={mailto} className="font-medium text-foreground underline">
          {DPO}
        </Link>{" "}
        desde la misma dirección de correo con la que creaste la cuenta, para
        que podamos verificar que sos su titular. Si escribís desde otra
        dirección vamos a pedirte información adicional antes de continuar.
      </p>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        También podés hacerlo desde la app: <strong>Perfil</strong> →{" "}
        <strong>Eliminar mi cuenta</strong>.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold tracking-tight">
        Qué se elimina
      </h2>
      <Bullets
        items={[
          "Tus datos personales: nombre, apellido, correo electrónico, teléfono, documento y dirección.",
          "Tu acceso: no vas a poder volver a iniciar sesión con esa cuenta.",
          "Tus puntos en todos los programas de los que participes. No se pueden recuperar ni transferir.",
          "Tu participación en cada club y el historial asociado.",
          "Tus canjes y el identificador de notificaciones de tus dispositivos.",
        ]}
      />

      <h2 className="mt-8 mb-2 text-lg font-semibold tracking-tight">
        Qué se conserva, y por qué
      </h2>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        Las ventas que las organizaciones registraron en sus propios sistemas se
        conservan como operación comercial, desvinculadas de tu identidad: son
        registros contables de un tercero y existen obligaciones legales de
        conservarlos. Después de la eliminación esas operaciones ya no permiten
        identificarte.
      </p>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        También podemos conservar la constancia mínima de aceptación de los
        Términos y de la Política de Privacidad (versión, fecha y hora), que es
        la prueba de que el consentimiento existió.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold tracking-tight">Plazos</h2>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        Confirmamos la recepción del pedido y lo procesamos dentro de los plazos
        que fija la normativa argentina de protección de datos personales. Si
        considerás que tu solicitud no fue atendida, podés recurrir a la Agencia
        de Acceso a la Información Pública (AAIP).
      </p>

      <p className="mt-8 text-sm leading-6 text-muted-foreground">
        Más detalle en la{" "}
        <Link
          href="/legal/privacidad"
          className="font-medium text-foreground underline"
        >
          Política de Privacidad
        </Link>
        .
      </p>
    </article>
  );
}
