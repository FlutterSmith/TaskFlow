import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay sampling rate
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  beforeSend(event, hint) {
    // Filter out certain errors or modify events before sending
    if (event.exception) {
      const error = hint.originalException;

      // Don't send network errors in development
      if (process.env.NODE_ENV === 'development' && error instanceof Error) {
        if (error.message.includes('Network Error')) {
          return null;
        }
      }
    }

    return event;
  },

  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        process.env.NEXT_PUBLIC_API_URL || '',
      ],
    }),
  ],
});
