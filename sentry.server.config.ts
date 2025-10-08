import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  environment: process.env.NODE_ENV,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        const sensitiveParams = ['token', 'api_key', 'password'];
        sensitiveParams.forEach(param => {
          if (event.request?.query_string?.includes(param)) {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, 'g'),
              `${param}=REDACTED`
            );
          }
        });
      }
    }

    return event;
  },

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
