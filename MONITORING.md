# TaskFlow Monitoring & Observability Guide

Complete guide for setting up and using monitoring, error tracking, and observability tools for the TaskFlow application.

## Table of Contents

- [Overview](#overview)
- [Error Tracking with Sentry](#error-tracking-with-sentry)
- [Performance Monitoring](#performance-monitoring)
- [Analytics](#analytics)
- [Health Checks](#health-checks)
- [Alerting](#alerting)
- [Logging](#logging)
- [Metrics & Dashboards](#metrics--dashboards)

---

## Overview

TaskFlow uses a comprehensive monitoring stack:

- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Real user monitoring and Web Vitals
- **Lighthouse CI**: Automated performance testing
- **Winston**: Structured logging (backend)
- **GitHub Actions**: Automated health checks
- **Slack**: Real-time alerting

---

## Error Tracking with Sentry

### Setup

#### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Create an account or sign in
3. Create an organization

#### 2. Create Projects

Create two projects:

**Frontend Project:**
- Platform: Next.js
- Name: `taskflow-frontend`

**Backend Project:**
- Platform: Node.js/Express
- Name: `taskflow-api`

#### 3. Get DSN and Tokens

For each project:

1. Go to **Settings** → **Projects** → **[Your Project]**
2. Copy the DSN from **Client Keys (DSN)**
3. Create an Auth Token: **Settings** → **Developer Settings** → **Auth Tokens**
   - Scopes: `project:releases`, `org:read`

#### 4. Configure Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=taskflow-frontend
```

**Backend (api/.env):**
```env
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/789012
```

**GitHub Secrets:**
```
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=taskflow-frontend
SENTRY_PROJECT_BACKEND=taskflow-api
```

### Usage

#### Frontend Error Tracking

Automatic error capture is configured in:
- `sentry.client.config.ts` - Client-side errors
- `sentry.server.config.ts` - Server-side errors
- `sentry.edge.config.ts` - Edge runtime errors

**Manual error tracking:**

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exception
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      custom: {
        userId: user.id,
        action: 'riskyOperation',
      },
    },
  });
}

// Capture message
Sentry.captureMessage('Something important happened', 'info');

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User clicked button',
  level: 'info',
});

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

**Using monitoring utilities:**

```typescript
import { analytics, identifyUser, monitorApiCall } from '@/lib/monitoring';

// Track user
identifyUser({
  id: user.id,
  email: user.email,
  name: user.name,
});

// Monitor API call
const result = await monitorApiCall('getTasks', async () => {
  return await api.get('/tasks');
});

// Track custom event
analytics.trackAction('task_created', {
  projectId: project.id,
  assigneeId: assignee.id,
});
```

#### Backend Error Tracking

Automatic error capture is configured in `api/src/config/sentry.ts`.

**Manual error tracking:**

```typescript
import { captureException, addBreadcrumb } from '../config/sentry';

// Capture exception with context
try {
  await processTask(taskId);
} catch (error) {
  captureException(error as Error, {
    taskId,
    userId: req.user.userId,
  });
  throw error;
}

// Add breadcrumb
addBreadcrumb('Task processing started', 'task', 'info', { taskId });
```

### Sentry Features

#### 1. Error Grouping

Errors are automatically grouped by:
- Error type
- Stack trace
- Error message
- File location

#### 2. Source Maps

Source maps are automatically uploaded during deployment to de-minify stack traces.

#### 3. Session Replay

For frontend errors, Sentry captures:
- DOM snapshots
- User interactions
- Console logs
- Network requests

**Privacy**: All text and media are masked by default.

#### 4. Performance Monitoring

Tracks:
- Page load times
- API response times
- Database query duration
- Custom transactions

**Create custom transaction:**

```typescript
import * as Sentry from '@sentry/nextjs';

const transaction = Sentry.startTransaction({
  name: 'Complex Operation',
  op: 'custom',
});

try {
  // Do work
  const span = transaction.startChild({
    op: 'database',
    description: 'Fetch tasks',
  });

  await fetchTasks();
  span.finish();

  transaction.setHttpStatus(200);
} catch (error) {
  transaction.setHttpStatus(500);
  throw error;
} finally {
  transaction.finish();
}
```

#### 5. Release Tracking

Releases are automatically created during deployment and include:
- Commit SHA
- Deployment time
- Environment
- Associated errors

---

## Performance Monitoring

### Vercel Analytics

Automatically enabled for all Vercel deployments.

**Tracks:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

**View metrics:**
1. Go to Vercel dashboard
2. Select your project
3. Click **Analytics** tab

### Lighthouse CI

Runs automatically on every deployment.

**Performance budgets:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Configuration:** `lighthouserc.js`

**View reports:**
- Check GitHub Actions artifacts
- Or view temporary public storage link in workflow logs

### Web Vitals Reporting

Configured in `src/lib/monitoring.ts`:

```typescript
import { performance } from '@/lib/monitoring';

// In your _app.tsx or layout
export function reportWebVitals(metric: any) {
  performance.reportWebVitals(metric);
}
```

### Custom Performance Measurement

```typescript
import { performance } from '@/lib/monitoring';

// Start measurement
performance.startMeasure('dataProcessing');

// Do work...
await processLargeDataset();

// End measurement and send to monitoring
performance.endMeasure('dataProcessing');
```

---

## Analytics

### Google Analytics (Optional)

**Setup:**

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

**Usage:**

```typescript
import { analytics } from '@/lib/monitoring';

// Track page view (automatic on route change)
analytics.pageView('/dashboard');

// Track custom event
analytics.event('button_click', 'engagement', 'Create Task');

// Track with value
analytics.event('purchase', 'ecommerce', 'Pro Plan', 2999);
```

### Feature Usage Tracking

```typescript
import { logFeatureUsage } from '@/lib/monitoring';

// Track feature usage
logFeatureUsage('kanban_board', {
  projectId: project.id,
  columnCount: columns.length,
});
```

---

## Health Checks

### Frontend Health Endpoint

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "environment": "production",
  "version": "1.2.0",
  "checks": {
    "api": {
      "status": "healthy",
      "responseTime": 45
    },
    "memory": {
      "status": "healthy",
      "usage": {
        "rss": 123456,
        "heapTotal": 78910,
        "heapUsed": 56789
      }
    }
  }
}
```

### Backend Health Endpoints

#### Basic Health
```bash
GET /health
```

Returns server status and uptime.

#### Database Health
```bash
GET /health/db
```

Tests PostgreSQL connection and response time.

#### Redis Health
```bash
GET /health/redis
```

Tests Redis connection and response time.

#### Detailed Health
```bash
GET /health/detailed
```

Returns comprehensive health status of all services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "environment": "production",
  "version": "1.2.0",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "15ms"
    },
    "redis": {
      "status": "healthy",
      "responseTime": "3ms"
    },
    "memory": {
      "status": "healthy",
      "heapUsedPercent": "45.2%",
      "usage": {...}
    },
    "disk": {
      "status": "healthy",
      "message": "Disk usage within acceptable limits"
    }
  }
}
```

### Automated Health Checks

GitHub Actions runs health checks every 5 minutes:

**Workflow:** `.github/workflows/monitoring.yml`

Checks:
- Frontend availability
- Backend API availability
- Database connectivity
- Redis connectivity

**On failure:**
- Sends Slack alert
- Creates GitHub issue (optional)
- Pages on-call engineer (if configured)

---

## Alerting

### Slack Integration

**Setup:**

1. Create Slack app or incoming webhook
2. Get webhook URL
3. Add to GitHub secrets:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

**Alerts sent for:**
- ✅ Deployment success/failure
- ⚠️ Health check failures
- 🔒 Security vulnerabilities
- 🐛 Critical errors in Sentry
- 📊 Weekly uptime reports
- 🚀 New releases

### Sentry Alerts

**Configure in Sentry dashboard:**

1. Go to **Alerts** → **Create Alert**
2. Choose alert type:
   - Issues: New errors or error spikes
   - Performance: Slow transactions
   - Crash Rate: High crash rates

**Recommended alerts:**

**Critical Errors:**
- Trigger: New issue with level=error
- Action: Notify #alerts channel + email
- Frequency: Immediately

**Error Spike:**
- Trigger: 50+ errors in 5 minutes
- Action: Notify #alerts channel
- Frequency: Once per hour

**Slow API:**
- Trigger: P95 response time > 3s
- Action: Notify #performance channel
- Frequency: Once per day

**High Error Rate:**
- Trigger: Error rate > 5%
- Action: Page on-call engineer
- Frequency: Immediately

### Custom Alerting

You can add custom alerting logic in health check workflows or create separate workflows for specific monitoring needs.

---

## Logging

### Backend Logging

Uses Winston for structured logging.

**Configuration:** `api/src/utils/logger.ts`

**Log levels:**
- `error`: Errors and exceptions
- `warn`: Warning messages
- `info`: General information
- `http`: HTTP request logs
- `debug`: Detailed debugging (dev only)

**Usage:**

```typescript
import { logger } from '../utils/logger';

logger.info('Task created', { taskId, userId });
logger.warn('Rate limit approaching', { userId, requestCount });
logger.error('Database connection failed', { error: error.message });
logger.http(`${method} ${url} - ${statusCode} - ${responseTime}ms`);
logger.debug('Query executed', { sql, params, duration });
```

**Log files:**
- Location: `api/logs/`
- Files:
  - `app.log`: All logs
  - `error.log`: Error logs only
  - Daily rotation enabled

### Frontend Logging

Use browser console for client-side logging:

```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Production: Send to Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.addBreadcrumb({
  category: 'debug',
  message: 'Important state change',
  level: 'info',
  data: { state: currentState },
});
```

### Centralized Logging (Optional)

For production, consider using:

**LogDNA / Mezmo:**
1. Create account at [logdna.com](https://logdna.com)
2. Get ingestion key
3. Configure log streaming from Railway/Vercel

**Datadog:**
1. Create account at [datadoghq.com](https://datadoghq.com)
2. Install agent
3. Configure log collection

---

## Metrics & Dashboards

### Recommended Dashboard Structure

#### Application Dashboard

**Metrics:**
- Request rate (requests/min)
- Error rate (%)
- Response time (P50, P95, P99)
- Active users
- API endpoint performance

#### Infrastructure Dashboard

**Metrics:**
- CPU usage (%)
- Memory usage (%)
- Database connections
- Redis hit rate
- Network I/O

#### Business Dashboard

**Metrics:**
- New user signups
- Active organizations
- Tasks created/completed
- Feature adoption rates
- Conversion funnel

### Creating Custom Dashboards

#### Using Sentry

1. Go to **Dashboards** in Sentry
2. Click **Create Dashboard**
3. Add widgets:
   - Error rate by project
   - Transaction duration
   - User misery score
   - Custom queries

#### Using Vercel Analytics

Provides built-in dashboards for:
- Page performance
- Real user metrics
- Top pages
- Traffic sources

#### Custom Metrics

Send custom metrics to Sentry:

```typescript
import * as Sentry from '@sentry/nextjs';

// Track custom metric
const transaction = Sentry.startTransaction({ name: 'custom-metric' });
transaction.setMeasurement('tasks_processed', 150, 'none');
transaction.finish();
```

---

## Best Practices

### Error Handling

1. **Always provide context:**
   ```typescript
   captureException(error, {
     userId: user.id,
     action: 'deleteTask',
     taskId: task.id,
   });
   ```

2. **Filter sensitive data:**
   - Don't log passwords, tokens, or PII
   - Redact sensitive fields before logging

3. **Use appropriate log levels:**
   - `error`: Requires immediate attention
   - `warn`: Should be investigated
   - `info`: Normal operations
   - `debug`: Detailed debugging

### Performance Monitoring

1. **Set performance budgets:**
   - Page load < 3s
   - API response < 500ms
   - Database queries < 100ms

2. **Monitor key user flows:**
   - Authentication
   - Task creation
   - Project management
   - Search

3. **Track custom metrics:**
   - Business-specific KPIs
   - Feature usage
   - Conversion rates

### Alerting

1. **Avoid alert fatigue:**
   - Only alert on actionable issues
   - Set appropriate thresholds
   - Use alert grouping

2. **Define severity levels:**
   - **P0**: Production down, immediate action
   - **P1**: Major feature broken, fix within 1 hour
   - **P2**: Minor feature broken, fix within 1 day
   - **P3**: Nice to have, fix when possible

3. **Document runbooks:**
   - What the alert means
   - How to investigate
   - How to resolve

---

## Troubleshooting

### Sentry Issues

**Errors not appearing:**
1. Check DSN configuration
2. Verify network requests in DevTools
3. Check Sentry quota limits
4. Review `beforeSend` filters

**Too many errors:**
1. Adjust sampling rate
2. Add more filters in `beforeSend`
3. Fix noisy errors first
4. Use rate limiting

**Source maps not working:**
1. Verify source maps are uploaded
2. Check release name matches
3. Ensure auth token has correct permissions

### Performance Issues

**Slow health checks:**
1. Check database connection pool
2. Verify Redis is running
3. Review database indexes
4. Check network latency

**High memory usage:**
1. Check for memory leaks
2. Review object caching strategy
3. Analyze heap snapshots
4. Optimize database queries

---

## Resources

### Documentation

- [Sentry Docs](https://docs.sentry.io)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Winston Logger](https://github.com/winstonjs/winston)

### Tools

- [Sentry CLI](https://docs.sentry.io/product/cli/)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Lighthouse CI CLI](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/cli.md)

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintained by**: DevOps Team
