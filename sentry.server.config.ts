import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // v11: equivalente a sendDefaultPii: true (el resto de categorias ya viene en true)
  dataCollection: { userInfo: true },
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attach local variable values to stack frames
  includeLocalVariables: true,
});
