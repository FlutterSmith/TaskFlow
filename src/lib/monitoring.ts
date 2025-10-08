import * as Sentry from '@sentry/nextjs';

/**
 * Analytics tracking utility for user events and page views
 */
export const analytics = {
  /**
   * Track page view
   */
  pageView: (url: string) => {
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
          page_path: url,
        });
      }

      // Vercel Analytics
      if (window.va) {
        window.va('pageview', { path: url });
      }
    }
  },

  /**
   * Track custom event
   */
  event: (action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value,
        });
      }

      // Vercel Analytics
      if (window.va) {
        window.va('event', {
          name: action,
          data: {
            category,
            label,
            value,
          },
        });
      }

      // Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: 'analytics',
        message: `${category}: ${action}`,
        level: 'info',
        data: { label, value },
      });
    }
  },

  /**
   * Track user action
   */
  trackAction: (action: string, data?: Record<string, any>) => {
    analytics.event(action, 'user_action', JSON.stringify(data));
  },

  /**
   * Track error
   */
  trackError: (error: Error, context?: Record<string, any>) => {
    console.error('Error tracked:', error);

    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });

    analytics.event('error', 'error', error.message);
  },
};

/**
 * Performance monitoring utility
 */
export const performance = {
  /**
   * Start performance measurement
   */
  startMeasure: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`);
    }
  },

  /**
   * End performance measurement and send to monitoring
   */
  endMeasure: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);

      const measure = window.performance.getEntriesByName(name)[0];
      if (measure) {
        // Send to Sentry
        const transaction = Sentry.startTransaction({
          name,
          op: 'measure',
        });
        transaction.setMeasurement(name, measure.duration, 'millisecond');
        transaction.finish();

        // Send to analytics
        analytics.event('performance', 'timing', name, Math.round(measure.duration));

        // Cleanup
        window.performance.clearMarks(`${name}-start`);
        window.performance.clearMarks(`${name}-end`);
        window.performance.clearMeasures(name);
      }
    }
  },

  /**
   * Report Web Vitals
   */
  reportWebVitals: (metric: any) => {
    // Send to Vercel Analytics
    if (window.va) {
      window.va('event', {
        name: metric.name,
        data: {
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
        },
      });
    }

    // Send to Sentry
    const transaction = Sentry.startTransaction({
      name: 'web-vitals',
      op: metric.name,
    });
    transaction.setMeasurement(metric.name, metric.value, metric.unit);
    transaction.finish();

    // Log significant metrics
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name}:`, metric.value);
    }
  },
};

/**
 * User identification for monitoring services
 */
export const identifyUser = (user: { id: string; email: string; name?: string }) => {
  // Sentry
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });

  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', {
      user_id: user.id,
    });
  }
};

/**
 * Clear user identification
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * Log feature usage
 */
export const logFeatureUsage = (feature: string, data?: Record<string, any>) => {
  analytics.event('feature_used', 'engagement', feature);

  Sentry.addBreadcrumb({
    category: 'feature',
    message: `Used feature: ${feature}`,
    level: 'info',
    data,
  });
};

/**
 * Monitor API call performance
 */
export const monitorApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const transaction = Sentry.startTransaction({
    name: `API: ${name}`,
    op: 'http.client',
  });

  const startTime = Date.now();

  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;

    transaction.setHttpStatus(200);
    transaction.setMeasurement('duration', duration, 'millisecond');

    // Log slow API calls
    if (duration > 3000) {
      console.warn(`Slow API call: ${name} took ${duration}ms`);
      analytics.event('slow_api', 'performance', name, duration);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    transaction.setHttpStatus(500);
    transaction.setMeasurement('duration', duration, 'millisecond');

    Sentry.captureException(error, {
      contexts: {
        api: {
          name,
          duration,
        },
      },
    });

    throw error;
  } finally {
    transaction.finish();
  }
};

// Type definitions for window objects
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    va?: (event: string, data?: any) => void;
  }
}
