# TaskFlow CI/CD Setup Guide

Step-by-step guide to configure the complete CI/CD pipeline for TaskFlow.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Repository Setup](#github-repository-setup)
- [Vercel Setup](#vercel-setup)
- [Railway Setup](#railway-setup)
- [Database Setup](#database-setup)
- [Monitoring Setup](#monitoring-setup)
- [Testing the Pipeline](#testing-the-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with repository access
- [ ] Vercel account ([vercel.com/signup](https://vercel.com/signup))
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Sentry account ([sentry.io](https://sentry.io)) (optional but recommended)
- [ ] Snyk account ([snyk.io](https://snyk.io)) (optional for security scanning)
- [ ] Slack workspace (optional for notifications)

---

## GitHub Repository Setup

### 1. Initialize Repository

```bash
# Clone or create repository
git clone https://github.com/your-org/taskflow.git
cd taskflow

# Ensure all files are committed
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Ensure "Allow all actions and reusable workflows" is selected
4. Save settings

### 3. Configure Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - [x] Require pull request before merging
   - [x] Require status checks to pass before merging
   - [x] Require branches to be up to date before merging
   - [x] Include administrators
5. Add required status checks:
   - `frontend-ci`
   - `backend-ci`
   - `e2e-tests`
   - `security-scan`
6. Save changes

---

## Vercel Setup

### 1. Create Vercel Account

1. Go to [vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### 2. Create New Project

1. Click **Add New** → **Project**
2. Import your repository: `your-org/taskflow`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### 3. Configure Environment Variables

Add these environment variables in Vercel:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=https://your-backend.railway.app

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/123456
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=taskflow-frontend
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**To add environment variables:**
1. Project Settings → **Environment Variables**
2. Add each variable
3. Select environments: Production, Preview, Development

### 4. Get Vercel Credentials

**Vercel Token:**
1. Go to **Account Settings** → **Tokens**
2. Create new token: "GitHub Actions"
3. Copy token

**Organization ID and Project ID:**
1. Go to Project **Settings** → **General**
2. Copy **Organization ID** (Team ID)
3. Copy **Project ID**

**Add to GitHub Secrets:**
```
VERCEL_TOKEN=<your-token>
VERCEL_ORG_ID=<org-id>
VERCEL_PROJECT_ID=<project-id>
```

### 5. Configure Domains (Optional)

1. Go to Project **Settings** → **Domains**
2. Add custom domain: `app.yourdomain.com`
3. Follow DNS configuration instructions

---

## Railway Setup

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify email

### 2. Create New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository
4. Select path: `api/`

### 3. Configure Service

**Build Settings:**
1. Go to service **Settings**
2. **Build Command**: `npm ci && npm run prisma:generate && npm run build`
3. **Start Command**: `npm run prisma:migrate:deploy && npm start`
4. **Watch Paths**: `api/**`

**Environment Variables:**

Add these in Railway service settings:

```env
# Server
NODE_ENV=production
PORT=4000
API_VERSION=v1

# Database (auto-provided by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (if using Railway Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secrets
JWT_SECRET=<generate-with: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate-with: openssl rand -base64 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-app.vercel.app

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/789012

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 4. Add PostgreSQL Database

1. In your project, click **New** → **Database** → **Add PostgreSQL**
2. Railway automatically creates `DATABASE_URL` variable
3. Connect it to your service (click and drag connection)

### 5. Add Redis (Optional)

1. Click **New** → **Database** → **Add Redis**
2. Railway automatically creates `REDIS_URL` variable
3. Connect it to your service

### 6. Generate Domain

1. Go to service **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy the generated URL (e.g., `your-service.railway.app`)
4. Update `NEXT_PUBLIC_API_URL` in Vercel
5. Update `CORS_ORIGIN` in Railway

### 7. Get Railway Credentials

**Railway Token:**
1. Go to **Account Settings** → **Tokens**
2. Create new token: "GitHub Actions"
3. Copy token

**Service ID:**
1. Go to your service
2. Copy service ID from URL: `railway.app/project/<project-id>/service/<service-id>`

**Add to GitHub Secrets:**
```
RAILWAY_TOKEN=<your-token>
RAILWAY_SERVICE_ID=<service-id>
RAILWAY_APP_URL=https://your-service.railway.app
```

---

## Database Setup

### 1. Initialize Database

Once Railway PostgreSQL is added and connected:

```bash
# Set DATABASE_URL locally for testing
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Generate Prisma Client
cd api
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# (Optional) Seed database
npm run prisma:seed
```

### 2. Verify Database Connection

```bash
# Open Prisma Studio
npm run prisma:studio

# Or test connection
npm run test:db
```

### 3. Production Migration Strategy

Migrations are automatically run during Railway deployment via:
```bash
npm run prisma:migrate:deploy
```

This is configured in the start command.

---

## Monitoring Setup

### 1. Sentry Setup

**Create Organization:**
1. Go to [sentry.io](https://sentry.io)
2. Create organization: "your-org"

**Create Projects:**
1. Click **Projects** → **Create Project**
2. Create two projects:
   - Platform: Next.js, Name: `taskflow-frontend`
   - Platform: Node.js, Name: `taskflow-api`

**Get DSNs:**
1. Go to each project's **Settings** → **Client Keys**
2. Copy DSN for each project

**Create Auth Token:**
1. Go to **Settings** → **Developer Settings** → **Auth Tokens**
2. Click **Create New Token**
3. Name: "GitHub Actions"
4. Scopes: `project:releases`, `org:read`, `project:write`
5. Copy token

**Add to GitHub Secrets:**
```
SENTRY_AUTH_TOKEN=<your-token>
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=taskflow-frontend
SENTRY_PROJECT_BACKEND=taskflow-api
```

**Add to Vercel:**
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/frontend-id
SENTRY_AUTH_TOKEN=<your-token>
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=taskflow-frontend
```

**Add to Railway:**
```
SENTRY_DSN=https://xxx@sentry.io/backend-id
```

### 2. Snyk Setup (Optional)

1. Go to [snyk.io](https://snyk.io)
2. Sign up with GitHub
3. Go to **Account Settings** → **API Token**
4. Copy token

**Add to GitHub Secrets:**
```
SNYK_TOKEN=<your-token>
```

### 3. Slack Setup (Optional)

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create new app: "TaskFlow CI/CD"
3. Enable **Incoming Webhooks**
4. Add webhook to channel (e.g., #deployments)
5. Copy webhook URL

**Add to GitHub Secrets:**
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## GitHub Secrets Summary

Add all these secrets in your GitHub repository:

**Repository Settings** → **Secrets and variables** → **Actions** → **New repository secret**

```
# Vercel
VERCEL_TOKEN=<vercel-token>
VERCEL_ORG_ID=<org-id>
VERCEL_PROJECT_ID=<project-id>

# Railway
RAILWAY_TOKEN=<railway-token>
RAILWAY_SERVICE_ID=<service-id>
RAILWAY_APP_URL=https://your-backend.railway.app

# Frontend URL (for health checks)
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-backend.railway.app

# Monitoring
SENTRY_AUTH_TOKEN=<sentry-auth-token>
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=taskflow-frontend
SENTRY_PROJECT_BACKEND=taskflow-api

# Security Scanning
SNYK_TOKEN=<snyk-token>

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Testing the Pipeline

### 1. Test CI Pipeline

Create a test PR:

```bash
git checkout -b test/ci-pipeline
echo "# Test" >> README.md
git add README.md
git commit -m "test: CI pipeline"
git push origin test/ci-pipeline
```

Create PR on GitHub and verify:
- [ ] Frontend CI runs and passes
- [ ] Backend CI runs and passes
- [ ] E2E tests run and pass
- [ ] Security scan runs
- [ ] All status checks pass

### 2. Test Deployment

Merge PR to main:

```bash
git checkout main
git merge test/ci-pipeline
git push origin main
```

Verify:
- [ ] Frontend deploys to Vercel
- [ ] Backend deploys to Railway
- [ ] Database migrations run
- [ ] Health checks pass
- [ ] Sentry release created
- [ ] Slack notification sent (if configured)

### 3. Test Health Checks

```bash
# Test frontend health
curl https://your-app.vercel.app/api/health

# Test backend health
curl https://your-backend.railway.app/health
curl https://your-backend.railway.app/health/db
curl https://your-backend.railway.app/health/redis
```

All should return `200 OK` with health status.

### 4. Test Error Tracking

Create a test error:

```typescript
// In any component
throw new Error('Test error for Sentry');
```

Verify error appears in Sentry dashboard within 1 minute.

### 5. Test Monitoring Workflow

Manual trigger:

1. Go to **Actions** → **Monitoring & Health Checks**
2. Click **Run workflow**
3. Verify:
   - [ ] Health checks pass
   - [ ] No alerts sent

---

## Troubleshooting

### CI Pipeline Fails

**Frontend CI fails:**
```bash
# Run locally
npm run type-check
npm run lint
npm test
npm run build
```

**Backend CI fails:**
```bash
cd api
npm run lint
npm run test
npm run build
```

### Deployment Fails

**Vercel deployment fails:**
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check for package.json issues

**Railway deployment fails:**
1. Check Railway deployment logs
2. Verify DATABASE_URL is set
3. Check Prisma schema is valid
4. Verify migrations are up to date

### Health Checks Fail

**Frontend health check fails:**
- Verify Vercel deployment succeeded
- Check Vercel function logs
- Verify API URL is correct

**Backend health check fails:**
- Check Railway service is running
- Verify database connection
- Check Redis connection (if using)
- Review Railway logs

### Sentry Not Working

**Errors not appearing:**
- Verify DSN is correct
- Check network tab for Sentry requests
- Review `beforeSend` filters
- Check Sentry quota

**Source maps not uploading:**
- Verify `SENTRY_AUTH_TOKEN` has correct permissions
- Check deployment logs for upload errors
- Verify project names match

---

## Next Steps

After successful setup:

1. **Configure alerts** in Sentry
2. **Set up custom domains** in Vercel
3. **Review security settings** in Railway
4. **Configure backups** for database
5. **Set up staging environment** (optional)
6. **Document team workflows** in wiki
7. **Train team on CI/CD process**

---

## Maintenance

### Weekly Tasks

- [ ] Review Sentry errors
- [ ] Check dependency updates (Dependabot)
- [ ] Review performance metrics
- [ ] Check database backups

### Monthly Tasks

- [ ] Update dependencies
- [ ] Review and optimize CI/CD workflows
- [ ] Audit security settings
- [ ] Review and update documentation

### Quarterly Tasks

- [ ] Review and optimize infrastructure costs
- [ ] Conduct disaster recovery test
- [ ] Review and update monitoring alerts
- [ ] Security audit

---

## Support

Need help?

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures
2. Check [MONITORING.md](./MONITORING.md) for monitoring details
3. Review GitHub Actions logs
4. Check service status pages:
   - [Vercel Status](https://www.vercel-status.com/)
   - [Railway Status](https://status.railway.app/)
   - [GitHub Status](https://www.githubstatus.com/)
5. Contact DevOps team

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintained by**: DevOps Team
