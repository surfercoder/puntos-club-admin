'use client';

import { useEffect, useReducer, useRef } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Loader2, ScrollText, ShieldCheck } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { verifyCaptchaToken } from '@/actions/onboarding/verify-captcha';

const LS_CONSENT = 'onboarding_consent';

// --- State & Reducer ---

interface ConsentState {
  hasScrolledToBottom: boolean;
  consentChecked: boolean;
  captchaToken: string | null;
  captchaStatus: 'idle' | 'success' | 'error' | 'expired';
  captchaError: string | null;
  isVerifying: boolean;
}

type ConsentAction =
  | { type: 'SCROLL_TO_BOTTOM' }
  | { type: 'SET_CONSENT'; value: boolean }
  | { type: 'CAPTCHA_SUCCESS'; token: string }
  | { type: 'CAPTCHA_ERROR' }
  | { type: 'CAPTCHA_EXPIRE' }
  | { type: 'VERIFY_START' }
  | { type: 'VERIFY_FAILED'; error: string }
  | { type: 'RESTORE_FROM_STORAGE' };

const initialState: ConsentState = {
  hasScrolledToBottom: false,
  consentChecked: false,
  captchaToken: null,
  captchaStatus: 'idle',
  captchaError: null,
  isVerifying: false,
};

function consentReducer(state: ConsentState, action: ConsentAction): ConsentState {
  switch (action.type) {
    case 'SCROLL_TO_BOTTOM':
      return { ...state, hasScrolledToBottom: true };
    case 'SET_CONSENT':
      if (!action.value) {
        return { ...state, consentChecked: false, captchaToken: null, captchaStatus: 'idle', captchaError: null };
      }
      return { ...state, consentChecked: true };
    case 'CAPTCHA_SUCCESS':
      return { ...state, captchaToken: action.token, captchaStatus: 'success', captchaError: null };
    case 'CAPTCHA_ERROR':
      return { ...state, captchaToken: null, captchaStatus: 'error', captchaError: 'Error al cargar el captcha. Intentá de nuevo.' };
    case 'CAPTCHA_EXPIRE':
      return { ...state, captchaToken: null, captchaStatus: 'expired', captchaError: 'El captcha expiró. Por favor completalo de nuevo.' };
    case 'VERIFY_START':
      return { ...state, isVerifying: true, captchaError: null };
    case 'VERIFY_FAILED':
      return { ...state, isVerifying: false, captchaToken: null, captchaStatus: 'idle', captchaError: action.error };
    case 'RESTORE_FROM_STORAGE':
      return { ...state, consentChecked: true, hasScrolledToBottom: true };
    default:
      return state;
  }
}

// --- Sub-components ---

function TermsContent() {
  return (
    <>
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        Términos y Condiciones de Uso — Puntos Club
      </h2>
      <p className="text-xs text-muted-foreground">Última actualización: enero de 2025</p>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">1. Aceptación de los términos</h3>
        <p>
          Al registrarte como titular de un comercio adherido a la plataforma Puntos Club, declarás
          haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones
          de Uso (&ldquo;los Términos&rdquo;). Si no estás de acuerdo con alguna de las disposiciones aquí
          contenidas, debés abstenerte de utilizar la plataforma.
        </p>
        <p>
          Estos Términos constituyen un acuerdo legal vinculante entre vos (&ldquo;el Comercio&rdquo; o
          &ldquo;el titular&rdquo;) y Puntos Club S.A.S. (&ldquo;la Empresa&rdquo;, &ldquo;nosotros&rdquo;). La utilización de
          cualquier servicio ofrecido por la plataforma implica la aceptación plena e irrevocable
          de estos Términos.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">2. Descripción del servicio</h3>
        <p>
          Puntos Club es una plataforma digital de fidelización que permite a los comercios adheridos
          otorgar puntos a sus clientes por compras realizadas. Los clientes acumulan puntos y los
          canjean por premios o beneficios definidos por el propio comercio.
        </p>
        <p>
          La Empresa provee la infraestructura tecnológica necesaria (aplicación móvil para
          clientes, aplicación de caja para cajeros, y panel de administración web para titulares)
          bajo las condiciones pactadas en el plan contratado.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">3. Obligaciones del comercio titular</h3>
        <p>Como titular del comercio, te comprometés a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Proporcionar información veraz, precisa y actualizada durante el registro y en toda comunicación posterior.</li>
          <li>Mantener la confidencialidad de las credenciales de acceso al panel de administración.</li>
          <li>Notificar de inmediato a la Empresa ante cualquier uso no autorizado de tu cuenta.</li>
          <li>Cumplir con toda la legislación aplicable en materia de protección de datos personales, comercio electrónico y defensa del consumidor.</li>
          <li>No utilizar la plataforma para actividades ilícitas, fraudulentas o que violen derechos de terceros.</li>
          <li>Honrar los premios y canjes que hayas publicado en el catálogo de tu programa de fidelización.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">4. Privacidad y protección de datos</h3>
        <p>
          La Empresa recopila y trata datos personales de los usuarios de la plataforma de conformidad
          con su Política de Privacidad, la cual forma parte integrante de estos Términos. Al aceptar
          estos Términos, también aceptás la Política de Privacidad.
        </p>
        <p>
          El Comercio, en su rol de responsable del tratamiento respecto de los datos de sus clientes,
          deberá garantizar una base legal válida para el tratamiento de dichos datos y respetar los
          derechos de acceso, rectificación, cancelación y oposición reconocidos por la normativa
          aplicable.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">5. Planes, pagos y facturación</h3>
        <p>
          Los servicios de Puntos Club se ofrecen bajo distintos planes de suscripción. El plan
          contratado determinará las funcionalidades disponibles, el límite de clientes activos y
          las condiciones comerciales aplicables.
        </p>
        <p>
          Los pagos se procesan a través de Mercado Pago. Al proporcionar tus datos de pago,
          autorizás el débito recurrente de la cuota mensual correspondiente a tu plan. La Empresa
          no almacena datos de tarjetas de crédito o débito en sus servidores.
        </p>
        <p>
          En caso de falta de pago, la Empresa podrá suspender el acceso a la plataforma previo
          aviso con 72 horas de anticipación. La mora en el pago devengará un interés punitorio
          equivalente a la tasa activa del Banco de la Nación Argentina.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">6. Propiedad intelectual</h3>
        <p>
          Todos los derechos de propiedad intelectual sobre la plataforma Puntos Club, incluyendo
          pero no limitado a su código fuente, diseño, logos, marcas, y documentación, son
          propiedad exclusiva de la Empresa o de sus licenciantes. Queda estrictamente prohibida
          su reproducción, distribución, modificación o cualquier otro uso no autorizado.
        </p>
        <p>
          El Comercio retiene la propiedad de los contenidos que cargue en la plataforma (logos,
          imágenes, nombres comerciales, catálogo de premios). Al publicar dichos contenidos,
          otorgás a la Empresa una licencia no exclusiva para mostrarlos dentro del contexto
          del servicio prestado.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">7. Limitación de responsabilidad</h3>
        <p>
          La Empresa no será responsable por daños directos, indirectos, incidentales, especiales o
          consecuentes derivados del uso o imposibilidad de uso de la plataforma, incluyendo
          pérdida de ganancias, datos o buena voluntad comercial, aun cuando hubiere sido advertida
          de la posibilidad de tales daños.
        </p>
        <p>
          La plataforma se brinda &ldquo;tal como está&rdquo; (&ldquo;as is&rdquo;). La Empresa no garantiza que el
          servicio sea ininterrumpido, libre de errores o completamente seguro. Realizamos esfuerzos
          razonables para mantener la disponibilidad y seguridad del servicio, pero no ofrecemos
          garantías absolutas al respecto.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">8. Modificaciones a los términos</h3>
        <p>
          La Empresa se reserva el derecho de modificar estos Términos en cualquier momento. Los
          cambios serán comunicados con al menos 15 días de anticipación por correo electrónico
          y/o mediante aviso destacado en el panel de administración.
        </p>
        <p>
          El uso continuado de la plataforma con posterioridad a la entrada en vigencia de las
          modificaciones implica la aceptación de las nuevas condiciones.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">9. Resolución de disputas</h3>
        <p>
          Cualquier controversia derivada de la interpretación, aplicación o incumplimiento de
          estos Términos será sometida a la jurisdicción de los Tribunales Ordinarios de la
          Ciudad Autónoma de Buenos Aires, renunciando las partes a cualquier otro fuero que
          pudiera corresponderles.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">10. Contacto</h3>
        <p>
          Para consultas, reclamos o notificaciones relacionadas con estos Términos, podés
          contactarnos en{' '}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            legal@puntosclub.com
          </span>{' '}
          o por escrito a nuestra sede ubicada en la Ciudad Autónoma de Buenos Aires, Argentina.
        </p>
      </section>

      <div className="h-4" aria-hidden />
    </>
  );
}

interface CaptchaVerificationProps {
  status: ConsentState['captchaStatus'];
  error: string | null;
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
  recaptchaRef: React.RefObject<ReCAPTCHA | null>;
}

function CaptchaVerification({ status, error, onSuccess, onError, onExpire, recaptchaRef }: CaptchaVerificationProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-4 space-y-3 transition-all">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Confirmá que no sos un robot
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Completá la verificación de seguridad para continuar con tu registro.
      </p>

      <div className="flex items-center justify-start">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
          onChange={(token) => {
            if (token) onSuccess(token);
          }}
          onErrored={onError}
          onExpired={onExpire}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {status === 'success' && !error && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verificación completada.
        </div>
      )}
    </div>
  );
}

// --- Main component ---

interface Step5ConsentProps {
  onNext: () => void;
  onBack: () => void;
  initialConsent?: boolean;
}

export function Step5Consent({ onNext, onBack, initialConsent = false }: Step5ConsentProps) {
  const t = useTranslations('Onboarding.step5');
  const tCommon = useTranslations('Common');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [state, dispatch] = useReducer(consentReducer, initialState);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_CONSENT);
      if (stored === 'true' || initialConsent) {
        dispatch({ type: 'RESTORE_FROM_STORAGE' });
      }
    } catch {
      if (initialConsent) dispatch({ type: 'RESTORE_FROM_STORAGE' });
    }
  }, [initialConsent]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || state.hasScrolledToBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
      dispatch({ type: 'SCROLL_TO_BOTTOM' });
    }
  };

  const handleConsentChange = (checked: boolean | 'indeterminate') => {
    const value = checked === true;
    dispatch({ type: 'SET_CONSENT', value });
    if (!value) {
      recaptchaRef.current?.reset();
    }
    try {
      if (value) {
        localStorage.setItem(LS_CONSENT, 'true');
      } else {
        localStorage.removeItem(LS_CONSENT);
      }
    } catch {
      // ignore
    }
  };

  const handleContinue = async () => {
    if (!state.captchaToken) return;
    dispatch({ type: 'VERIFY_START' });
    try {
      const result = await verifyCaptchaToken(state.captchaToken);
      if (result.success) {
        onNext();
      } else {
        recaptchaRef.current?.reset();
        dispatch({ type: 'VERIFY_FAILED', error: result.error ?? 'Verificación fallida. Intentá de nuevo.' });
      }
    } catch {
      recaptchaRef.current?.reset();
      dispatch({ type: 'VERIFY_FAILED', error: 'Error inesperado. Intentá de nuevo.' });
    }
  };

  const canContinue = state.consentChecked && state.captchaStatus === 'success' && state.captchaToken !== null && !state.isVerifying;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <ScrollText className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Por favor leé los términos y condiciones completos. Debés desplazarte hasta el final
          para poder aceptarlos y continuar.
        </span>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 text-sm text-gray-700 dark:text-gray-300 space-y-5 scroll-smooth"
        >
          <TermsContent />
        </div>

        {!state.hasScrolledToBottom && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 rounded-b-xl bg-gradient-to-t from-gray-50 dark:from-gray-800/90 to-transparent"
            aria-hidden
          />
        )}
      </div>

      {!state.hasScrolledToBottom && (
        <p className="text-center text-xs text-muted-foreground">
          {t('scrollPrompt')}
        </p>
      )}

      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border p-4 transition-all',
          state.hasScrolledToBottom
            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-50 select-none'
        )}
      >
        <Checkbox
          id="consent-checkbox"
          checked={state.consentChecked}
          onCheckedChange={handleConsentChange}
          disabled={!state.hasScrolledToBottom}
          className="mt-0.5"
        />
        <Label
          htmlFor="consent-checkbox"
          className={cn(
            'text-sm leading-snug cursor-pointer',
            state.hasScrolledToBottom
              ? 'text-gray-700 dark:text-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          )}
        >
          {t('acceptTerms')}
        </Label>
      </div>

      {state.consentChecked && (
        <CaptchaVerification
          status={state.captchaStatus}
          error={state.captchaError}
          recaptchaRef={recaptchaRef}
          onSuccess={(token) => dispatch({ type: 'CAPTCHA_SUCCESS', token })}
          onError={() => dispatch({ type: 'CAPTCHA_ERROR' })}
          onExpire={() => dispatch({ type: 'CAPTCHA_EXPIRE' })}
        />
      )}

      {canContinue && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {t('allDone')}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={state.isVerifying}
          className="sm:flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('back')}
        </Button>
        <Button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={cn(
            'sm:flex-1',
            canContinue
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-emerald-600/50 cursor-not-allowed'
          )}
        >
          {state.isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('verifying')}
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {tCommon('continue')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
