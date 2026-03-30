// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust trace sampling per environment to control costs
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // UU PDP Compliance: Do not send raw PII (IP, cookies) to third-party services.
  // Use Sentry.setUser() with pseudonymized IDs if user context is needed.
  sendDefaultPii: false,
});
