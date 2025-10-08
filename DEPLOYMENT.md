# TaskFlow Deployment Guide

This guide covers the complete deployment process for the TaskFlow application, including CI/CD pipeline, monitoring setup, and troubleshooting.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment Process](#deployment-process)
- [Monitoring & Alerting](#monitoring--alerting)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## Overview

TaskFlow uses a modern CI/CD pipeline with automated testing, security scanning, and deployment to production environments:

- **Frontend**: Deployed to Vercel with automatic preview deployments for PRs
- **Backend**: Deployed to Railway with database migrations
- **Testing**: Automated unit, integration, and E2E tests on every PR
- **Monitoring**: Sentry for error tracking, Vercel Analytics for performance
- **Security**: Snyk scanning, dependency audits, and secret detection

## Prerequisites

Before deploying TaskFlow, ensure you have:

### Required Accounts

1. **GitHub** - Repository hosting and CI/CD
2. **Vercel** - Frontend hosting
3. **Railway** - Backend API hosting
4. **PostgreSQL Database** - Provided by Railway or external
5. **Redis** - Caching layer (optional but recommended)

### Optional Services

6. **Sentry** - Error tracking and performance monitoring
7. **Snyk** - Security vulnerability scanning
8. **Slack** - Deployment notifications

### Local Requirements

- Node.js 18+
- npm or yarn
- Git
- Docker (for local testing)

---

## Environment Setup

### 1. Frontend Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=https://your-backend.railway.app

# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=taskflow-frontend
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 2. Backend Environment Variables

Create a `.env` file in the `api/` directory:

```env
# Server
NODE_ENV=production
PORT=4000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@host:port/taskflow?schema=public

# Redis
REDIS_URL=redis://host:port

# JWT Secrets
JWT_SECRET=<generate-with-openssl-rand-base64-64>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-app.vercel.app

# File Upload (if using S3)
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
AWS_S3_BUCKET=taskflow-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
SENTRY_DSN=https://your-backend-sentry-dsn@sentry.io/project-id

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@taskflow.com
```

### 3. GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets → Actions):

#### Deployment Secrets

```
VERCEL_TOKEN=<vercel-token>
VERCEL_ORG_ID=<vercel-org-id>
VERCEL_PROJECT_ID=<vercel-project-id>

RAILWAY_TOKEN=<railway-token>
RAILWAY_SERVICE_ID=<railway-service-id>
RAILWAY_APP_URL=https://your-backend.railway.app
```

#### Monitoring Secrets

```
SENTRY_AUTH_TOKEN=<sentry-auth-token>
SENTRY_ORG=<your-org>
SENTRY_PROJECT=taskflow-frontend
SENTRY_PROJECT_BACKEND=taskflow-api

SNYK_TOKEN=<snyk-token>
```

#### Notification Secrets

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## CI/CD Pipeline

### Workflow Overview

TaskFlow uses 5 GitHub Actions workflows:

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)

Runs on every PR and push to `main` or `develop`:

- **Frontend CI**
  - Type checking with TypeScript
  - Linting with ESLint
  - Unit tests with Jest (70% coverage threshold)
  - Build verification

- **Backend CI**
  - Type checking
  - Linting
  - Unit tests with coverage
  - Prisma schema validation
  - Build verification

- **E2E Tests**
  - Playwright tests across Chrome, Firefox, Safari
  - Mobile device testing (Pixel 5, iPhone 12)
  - Visual regression testing

- **Security Scanning**
  - Snyk vulnerability scanning
  - npm audit
  - Secret detection with TruffleHog
  - Dependency license checking

#### 2. **Frontend Deployment** (`.github/workflows/deploy-frontend.yml`)

Triggered on push to `main` or manual dispatch:

- Pull Vercel environment configuration
- Build Next.js application
- Deploy to Vercel (production or staging)
- Run Lighthouse CI performance tests
- Create Sentry release with sourcemaps
- Post deployment URL to PR (if applicable)
- Send Slack notification

#### 3. **Backend Deployment** (`.github/workflows/deploy-backend.yml`)

Triggered on push to `main` or manual dispatch:

- Install dependencies
- Generate Prisma client
- Build TypeScript
- Deploy to Railway
- Run database migrations
- Health checks (API, database, Redis)
- Run smoke tests
- Create Sentry release
- Send Slack notification
- Automatic rollback on failure

#### 4. **Release Management** (`.github/workflows/release.yml`)

Triggered on push to `main`:

- Analyze commits using conventional commits
- Determine version bump (major/minor/patch)
- Generate changelog
- Create GitHub release
- Update package versions
- Tag release

#### 5. **Monitoring** (`.github/workflows/monitoring.yml`)

Runs on schedule (every 5 minutes) and manual dispatch:

- Health checks for frontend and backend
- Performance monitoring with Lighthouse
- Security scanning
- Dependency checks
- Uptime reporting (weekly)
- Slack alerts on failures

---

## Deployment Process

### Deploying to Production

#### Automatic Deployment

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit using conventional commits:**
   ```bash
   git add .
   git commit -m "feat: add new task filtering feature"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request:**
   - CI pipeline runs automatically
   - Review test results and coverage
   - Request code review

5. **Merge to main:**
   - Merging to `main` triggers automatic deployment
   - Frontend deploys to Vercel
   - Backend deploys to Railway with migrations
   - Release is created automatically

#### Manual Deployment

You can trigger manual deployments from GitHub Actions:

1. Go to **Actions** → **Deploy Frontend/Backend**
2. Click **Run workflow**
3. Select environment (production or staging)
4. Click **Run workflow**

### Local Testing Before Deployment

#### Frontend

```bash
# Run all checks locally
npm run type-check
npm run lint
npm test
npm run build

# Test production build
npm start
```

#### Backend

```bash
cd api

# Run all checks
npm run lint
npm run test
npm run build

# Test with Docker
docker-compose up -d
npm run dev
```

#### E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui
```

---

## Monitoring & Alerting

### Sentry Setup

#### 1. Create Sentry Projects

- Frontend project: `taskflow-frontend`
- Backend project: `taskflow-api`

#### 2. Configure DSNs

Add DSNs to environment variables:

```env
# Frontend
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/frontend-project-id

# Backend
SENTRY_DSN=https://xxx@sentry.io/backend-project-id
```

#### 3. Sentry Features

- **Error Tracking**: Automatic error capture and grouping
- **Performance Monitoring**: Track slow API calls and page loads
- **Session Replay**: Visual playback of user sessions with errors
- **Release Tracking**: Associate errors with specific deployments
- **Source Maps**: Uploaded automatically during deployment

### Vercel Analytics

Enabled automatically for all deployments:

- **Web Vitals**: LCP, FID, CLS, FCP, TTFB
- **Real User Monitoring**: Actual user performance metrics
- **Insights**: Performance trends and regressions

### Health Checks

#### Frontend Health Endpoint

```bash
curl https://your-app.vercel.app/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "environment": "production",
  "version": "1.2.0",
  "checks": {
    "api": { "status": "healthy", "responseTime": 45 },
    "memory": { "status": "healthy", "usage": {...} }
  }
}
```

#### Backend Health Endpoints

```bash
# Basic health
curl https://your-backend.railway.app/health

# Database health
curl https://your-backend.railway.app/health/db

# Redis health
curl https://your-backend.railway.app/health/redis

# Detailed health
curl https://your-backend.railway.app/health/detailed
```

### Slack Notifications

Configured for:

- ✅ Deployment success/failure
- ⚠️ Health check failures
- 🔒 Security vulnerabilities detected
- 📊 Weekly uptime reports
- 🚨 Critical errors from Sentry

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Frontend build fails:**

```bash
# Check TypeScript errors
npm run type-check

# Check for dependency issues
rm -rf node_modules package-lock.json
npm install

# Check for environment variables
vercel env pull .env.local
```

**Backend build fails:**

```bash
cd api

# Regenerate Prisma client
npm run prisma:generate

# Check database connection
npm run prisma:studio

# Rebuild
npm run build
```

#### 2. Deployment Failures

**Vercel deployment fails:**

- Check build logs in Vercel dashboard
- Verify environment variables are set
- Check if build succeeds locally
- Ensure package.json scripts are correct

**Railway deployment fails:**

- Check Railway logs
- Verify DATABASE_URL is correct
- Ensure Prisma migrations are up to date
- Check if health checks are passing

#### 3. Database Migration Issues

**Migration fails:**

```bash
# Check migration status
npx prisma migrate status

# Reset database (CAUTION: destroys data)
npx prisma migrate reset

# Deploy pending migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name description
```

#### 4. Performance Issues

**Slow page loads:**

- Check Vercel Analytics for bottlenecks
- Review Lighthouse CI reports
- Check API response times in Sentry
- Enable caching for static assets

**Slow API responses:**

- Check database query performance
- Review Prisma query logs
- Add database indexes
- Enable Redis caching
- Check backend logs for slow operations

#### 5. Error Tracking Issues

**Errors not appearing in Sentry:**

- Verify SENTRY_DSN is set correctly
- Check Sentry quota and rate limits
- Review Sentry's `beforeSend` filter
- Check network requests in browser DevTools

---

## Rollback Procedures

### Automatic Rollback

Backend deployments automatically rollback on failure:

- Health check failures
- Smoke test failures
- Deployment errors

### Manual Rollback

#### Frontend (Vercel)

1. Go to Vercel dashboard
2. Select your project
3. Go to **Deployments**
4. Find previous working deployment
5. Click **⋯** → **Promote to Production**

Or via CLI:

```bash
vercel rollback https://your-deployment-url.vercel.app
```

#### Backend (Railway)

Via Railway dashboard:

1. Go to Railway project
2. Select your service
3. Go to **Deployments**
4. Click **⋯** on previous deployment
5. Select **Redeploy**

Or via CLI:

```bash
railway rollback --service=your-service-id
```

#### Database Rollback

**CAUTION**: Database rollbacks can cause data loss.

```bash
# Check migration history
npx prisma migrate status

# Rollback one migration
npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration state
npx prisma migrate deploy
```

### Post-Rollback Steps

1. **Verify rollback success:**
   - Check health endpoints
   - Test critical user flows
   - Review error rates in Sentry

2. **Investigate root cause:**
   - Review deployment logs
   - Check Sentry for new errors
   - Review code changes in failed deployment

3. **Create hotfix if needed:**
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/issue-description
   # Make fixes
   git commit -m "fix: resolve deployment issue"
   git push
   # Create PR and deploy
   ```

4. **Update team:**
   - Post incident summary in Slack
   - Document issue in runbook
   - Update monitoring if needed

---

## Best Practices

### Deployment Checklist

Before merging to main:

- [ ] All tests passing locally
- [ ] Code reviewed by at least one person
- [ ] No security vulnerabilities detected
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] Breaking changes communicated to team
- [ ] Monitoring dashboard reviewed

### Conventional Commits

Use semantic commit messages:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: code formatting
refactor: code restructuring
perf: performance improvement
test: add tests
build: build system changes
ci: CI/CD changes
chore: maintenance tasks
```

### Database Migrations

- **Always** test migrations on staging first
- **Never** drop columns or tables in production without backup
- **Always** make migrations reversible when possible
- **Use** transactions for data migrations
- **Review** migration SQL before deploying

### Security

- **Rotate** secrets regularly
- **Use** environment variables for all secrets
- **Enable** 2FA on all service accounts
- **Review** security scan results weekly
- **Update** dependencies monthly

---

## Monitoring Dashboard Links

Add your actual URLs here:

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.railway.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Sentry (Frontend)**: https://sentry.io/organizations/your-org/projects/taskflow-frontend
- **Sentry (Backend)**: https://sentry.io/organizations/your-org/projects/taskflow-api
- **Snyk Dashboard**: https://app.snyk.io/org/your-org
- **GitHub Actions**: https://github.com/your-org/taskflow/actions

---

## Support

For deployment issues:

1. Check this documentation first
2. Review GitHub Actions logs
3. Check service status pages (Vercel, Railway)
4. Contact DevOps team via Slack #deployments
5. Create incident ticket for critical issues

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintained by**: DevOps Team
