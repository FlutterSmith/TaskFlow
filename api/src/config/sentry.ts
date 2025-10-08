import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';
import { config } from './index';

export function initializeSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.env,

    // Set tracesSampleRate to capture a percentage of transactions
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,

    // Set profilesSampleRate to capture profiling data
    profilesSampleRate: config.env === 'production' ? 0.1 : 1.0,

    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app: undefined }),
      // Enable Profiling
      new ProfilingIntegration(),
    ],

    beforeSend(event, hint) {
      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;

        // Don't send validation errors
        if (error instanceof Error && error.name === 'ValidationError') {
          return null;
        }

        // Don't send 404 errors
        if (error instanceof Error && error.message.includes('Not Found')) {
          return null;
        }
      }

      // Remove sensitive data from request
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        // Redact sensitive body fields
        if (event.request.data) {
          const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
          if (typeof event.request.data === 'object') {
            sensitiveFields.forEach(field => {
              if (field in event.request.data) {
                event.request.data[field] = 'REDACTED';
              }
            });
          }
        }
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized');
}

// Express middleware for request handling
export const sentryRequestHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.requestHandler();
};

// Express middleware for error handling
export const sentryErrorHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (err: any, req: Request, res: Response, next: NextFunction) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      if (error.statusCode && error.statusCode >= 500) {
        return true;
      }
      return false;
    },
  });
};

// Express middleware for tracing
export const sentryTracingHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

// Manual error capture
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

// Manual message capture
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Create transaction for performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

// Set user context
export function setUser(user: { id: string; email: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

// Clear user context
export function clearUser() {
  Sentry.setUser(null);
}

// Add breadcrumb
export function addBreadcrumb(message: string, category: string, level: Sentry.SeverityLevel = 'info', data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}
