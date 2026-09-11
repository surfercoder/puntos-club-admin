// Supabase nunca traduce: GoTrue y PostgREST responden siempre en ingles
// ("Email not confirmed", "For security purposes, you can only request this
// after 60 seconds", "duplicate key value violates unique constraint ..."), y
// ademas su texto expone nombres de tablas y constraints. Todo error de
// servidor entra por aca y sale como clave de i18n del namespace `Errors`.
//
// Se mapea por `code`, no por el texto: el texto cambia entre versiones, el
// codigo no. El texto solo se usa para sacar los segundos del rate limit, que
// es informacion util para quien esta esperando.

/** Clave dentro del namespace `Errors` de messages/{es,en}.json. */
export type ErrorKey = string;

type Descriptor = { key: ErrorKey; params?: Record<string, string | number> };

// Codigos de GoTrue (@supabase/auth-js ErrorCode).
const AUTH_CODES: Record<string, ErrorKey> = {
  invalid_credentials: 'auth.invalidCredentials',
  email_not_confirmed: 'auth.emailNotConfirmed',
  user_already_exists: 'auth.emailExists',
  email_exists: 'auth.emailExists',
  identity_already_exists: 'auth.emailExists',
  weak_password: 'auth.weakPassword',
  same_password: 'auth.samePassword',
  email_address_invalid: 'auth.emailInvalid',
  email_address_not_authorized: 'auth.emailInvalid',
  validation_failed: 'auth.validationFailed',
  signup_disabled: 'auth.signupDisabled',
  email_provider_disabled: 'auth.signupDisabled',
  provider_disabled: 'auth.signupDisabled',
  user_banned: 'auth.userBanned',
  user_not_found: 'auth.userNotFound',
  otp_expired: 'auth.linkExpired',
  flow_state_expired: 'auth.linkExpired',
  bad_code_verifier: 'auth.linkExpired',
  session_expired: 'auth.sessionExpired',
  session_not_found: 'auth.sessionExpired',
  refresh_token_not_found: 'auth.sessionExpired',
  refresh_token_already_used: 'auth.sessionExpired',
  bad_jwt: 'auth.sessionExpired',
  no_authorization: 'auth.sessionExpired',
  captcha_failed: 'auth.captchaFailed',
  reauthentication_needed: 'auth.reauthNeeded',
  request_timeout: 'network',
};

// SQLSTATE de PostgREST. Nunca se muestra el detalle: trae nombres de tablas y
// de constraints, que es justo lo que el ticket pide no exponer.
const PG_CODES: Record<string, ErrorKey> = {
  '23505': 'db.duplicate',
  '23503': 'db.inUse',
  '23502': 'db.missingField',
  '23514': 'db.invalidValue',
  '22P02': 'db.invalidValue',
  '42501': 'db.forbidden',
  '42P01': 'unexpected',
  PGRST116: 'db.notFound',
  PGRST301: 'auth.sessionExpired',
};

// Excepciones que levantan las funciones del backend (RAISE EXCEPTION). Llegan
// en el message porque Postgres no las expone en el code.
const RPC_TOKENS: [string, ErrorKey][] = [
  ['INSUFFICIENT_POINTS', 'rpc.insufficientPoints'],
  ['OUT_OF_STOCK', 'rpc.outOfStock'],
  ['MEMBERSHIP_INACTIVE', 'rpc.membershipInactive'],
  ['REDEMPTION_NOT_PENDING', 'rpc.notPending'],
  ['REDEMPTION_NOT_FOUND', 'rpc.redemptionNotFound'],
  ['PLAN_LIMIT_REACHED', 'rpc.planLimitReached'],
];

// Claves propias que el codigo de la app lanza a proposito (`throw new
// AppError('...')`) y que ya son claves del namespace `Errors`.
const OWN_KEY = /^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)*$/;

// Un fetch que no llega a destino levanta TypeError, pero un bug nuestro (un
// null deref) levanta TypeError igual: clasificar por `name` mandaba al usuario
// a revisar el WiFi por un error de codigo, y encima lo tapaba en los logs. Se
// mira el texto, que es lo unico que distingue una cosa de la otra.
// "Failed to fetch" (Chrome), "NetworkError ..." (Firefox), "Load failed"
// (Safari), "Network request failed" (React Native), "fetch failed" (undici).
const NETWORK_TEXT =
  /network request failed|failed to fetch|fetch failed|networkerror|load failed/i;

const asRecord = (error: unknown) =>
  (error ?? {}) as {
    code?: unknown;
    status?: unknown;
    message?: unknown;
  };

// "you can only request this after 60 seconds" -> 60. Si el texto cambia y no
// matchea, el mensaje generico de rate limit sigue siendo correcto.
const secondsFrom = (message: string): number | undefined => {
  const found = /after (\d+) seconds?/i.exec(message);
  return found ? Number(found[1]) : undefined;
};

export function errorDescriptor(error: unknown): Descriptor {
  const { code, status, message } = asRecord(error);
  const text = typeof message === 'string' ? message : '';
  const codeText = typeof code === 'string' ? code : '';

  // El rate limit va primero: quien lo ve necesita saber cuanto esperar, y ese
  // dato solo esta en el texto.
  if (
    codeText === 'over_email_send_rate_limit' ||
    codeText === 'over_request_rate_limit' ||
    codeText === 'over_sms_send_rate_limit' ||
    status === 429
  ) {
    const seconds = secondsFrom(text);
    return seconds
      ? { key: 'auth.rateLimitSeconds', params: { seconds } }
      : { key: 'auth.rateLimit' };
  }

  if (codeText && AUTH_CODES[codeText]) return { key: AUTH_CODES[codeText] };
  if (codeText && PG_CODES[codeText]) return { key: PG_CODES[codeText] };

  for (const [token, key] of RPC_TOKENS) {
    if (text.includes(token)) return { key };
  }

  if (NETWORK_TEXT.test(text)) {
    return { key: 'network' };
  }

  // Un AppError nuestro ya trae la clave en el message.
  if (text && OWN_KEY.test(text)) return { key: text };

  return { key: 'unexpected' };
}

/**
 * Error de la aplicacion cuyo `message` es una clave del namespace `Errors`.
 * Lo usan las capas de datos para cortar con un motivo concreto sin tener que
 * armar texto (que no sabrian en que idioma escribir).
 */
export class AppError extends Error {
  constructor(key: ErrorKey) {
    super(key);
    this.name = 'AppError';
  }
}
