# TaskFlow API - Setup Guide

Complete setup instructions for the TaskFlow backend API.

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration.

### 3. Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start server
npm run dev
```

API runs at **http://localhost:4000**

---

## 📋 Detailed Setup

### Prerequisites

Install these before starting:

**Required:**
- [Node.js 18+](https://nodejs.org/) - JavaScript runtime
- [PostgreSQL 14+](https://www.postgresql.org/download/) - Database
- [Redis 6+](https://redis.io/download/) - Cache and sessions

**Optional:**
- [Docker](https://www.docker.com/) - For containerized development
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI (included with Prisma)

---

## 🐘 PostgreSQL Setup

### Option 1: Local Installation

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb taskflow
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb taskflow
```

**Windows:**
Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)

### Option 2: Docker

```bash
docker run --name taskflow-postgres \
  -e POSTGRES_USER=taskflow \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=taskflow \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Verify Connection

```bash
psql postgresql://taskflow:password@localhost:5432/taskflow
```

---

## 🔴 Redis Setup

### Option 1: Local Installation

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
Use [WSL](https://docs.microsoft.com/en-us/windows/wsl/) or download from [Redis for Windows](https://github.com/tporadowski/redis/releases)

### Option 2: Docker

```bash
docker run --name taskflow-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Verify Connection

```bash
redis-cli ping
# Should return: PONG
```

---

## ⚙️ Environment Configuration

Create `.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=4000
API_VERSION=v1

# Database (PostgreSQL)
DATABASE_URL="postgresql://taskflow:password@localhost:5432/taskflow?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET=generate-with-openssl-rand-base64-32
JWT_REFRESH_SECRET=generate-another-one
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@taskflow.com

# Monitoring (Optional)
SENTRY_DSN=
```

### Generate JWT Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32
```

---

## 🗄️ Database Setup

### 1. Generate Prisma Client

```bash
npm run prisma:generate
```

This creates TypeScript types from your schema.

### 2. Run Migrations

```bash
npm run prisma:migrate
```

This creates database tables based on `prisma/schema.prisma`.

### 3. (Optional) Seed Database

```bash
npm run prisma:seed
```

This populates the database with test data.

### 4. Open Prisma Studio

```bash
npm run prisma:studio
```

Opens a GUI at http://localhost:5555 to view/edit data.

---

## 🚀 Start Development Server

```bash
npm run dev
```

Server starts at **http://localhost:4000**

You should see:

```
╔════════════════════════════════════════╗
║                                        ║
║   🚀 TaskFlow API Server Running      ║
║                                        ║
║   Environment: development             ║
║   Port:        4000                    ║
║   API Version: v1                      ║
║                                        ║
║   http://localhost:4000                ║
║   Health: /health                      ║
║   API Docs: /api-docs                  ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 🐳 Docker Setup (Alternative)

Use Docker Compose to run everything:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Stop and remove volumes (wipes database)
docker-compose down -v
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 4000

---

## ✅ Verify Installation

### 1. Check Health Endpoint

```bash
curl http://localhost:4000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123,
  "environment": "development"
}
```

### 2. Test Registration

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Should return success with user data and tokens.

### 3. Test Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🔧 Development Workflow

### Making Changes

1. Edit files in `src/`
2. Server auto-restarts (tsx watch)
3. Test your changes

### Adding New Endpoints

1. Create module in `src/modules/`
2. Add routes, controller, service, validation
3. Register routes in `src/server.ts`

Example structure:
```
src/modules/tasks/
├── task.controller.ts
├── task.service.ts
├── task.routes.ts
└── task.validation.ts
```

### Database Changes

1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name add_new_field
   ```
3. Regenerate client:
   ```bash
   npm run prisma:generate
   ```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"

```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL

# Check .env file has correct DATABASE_URL
```

### "Redis connection refused"

```bash
# Check if Redis is running
redis-cli ping

# Start Redis
brew services start redis  # macOS
sudo systemctl start redis # Linux
```

### "Port 4000 already in use"

```bash
# Find and kill process
lsof -ti:4000 | xargs kill -9

# Or use different port in .env
PORT=4001
```

### "Prisma client not generated"

```bash
npm run prisma:generate
```

### "Migration failed"

```bash
# Reset database (DEV ONLY - destroys data)
npx prisma migrate reset

# Then run migrations again
npm run prisma:migrate
```

---

## 📊 Database GUI Tools

### Prisma Studio (Built-in)

```bash
npm run prisma:studio
```

Opens at http://localhost:5555

### pgAdmin (External)

1. Download from [pgadmin.org](https://www.pgadmin.org/)
2. Connect with:
   - Host: localhost
   - Port: 5432
   - Database: taskflow
   - Username: taskflow
   - Password: (from .env)

---

## 🚢 Production Deployment

### Build for Production

```bash
npm run build
```

Creates `dist/` folder with compiled JavaScript.

### Run Production Server

```bash
npm start
```

### Environment Variables

Set these in your hosting platform:

- `NODE_ENV=production`
- `DATABASE_URL` - Production PostgreSQL URL
- `REDIS_URL` - Production Redis URL
- `JWT_SECRET` - Strong random secret
- `JWT_REFRESH_SECRET` - Different strong secret
- `CORS_ORIGIN` - Your frontend URL

---

## 📚 Next Steps

1. ✅ Complete setup above
2. 📖 Read [README.md](./README.md) for API documentation
3. 🧪 Test endpoints with Postman or curl
4. 🔌 Connect frontend application
5. 🚀 Deploy to production

---

**Need Help?**
- Check [README.md](./README.md) for API docs
- Review [Prisma Docs](https://www.prisma.io/docs/)
- Open GitHub issue

---

**Happy Coding!** 🎉
