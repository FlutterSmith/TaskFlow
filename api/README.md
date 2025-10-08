# TaskFlow API - Backend

Production-ready Node.js/Express backend API for TaskFlow task management platform.

## 🚀 Features

### Core Features
- ✅ **RESTful API** - Clean, predictable API design
- ✅ **JWT Authentication** - Secure token-based auth with refresh tokens
- ✅ **Multi-tenant Architecture** - Organization-based data isolation
- ✅ **Role-Based Access Control** - Owner, Admin, Member, Guest roles
- ✅ **Real-time Updates** - Socket.IO for live collaboration
- ✅ **Rate Limiting** - Protect against abuse
- ✅ **Request Validation** - Zod schemas for type-safe validation
- ✅ **Error Handling** - Comprehensive error handling middleware
- ✅ **Audit Logging** - Track all important actions
- ✅ **Database** - PostgreSQL with Prisma ORM
- ✅ **Caching** - Redis for session management and caching

### Security Features
- ✅ **Password Hashing** - bcrypt with high salt rounds
- ✅ **JWT Security** - Short-lived access tokens, long-lived refresh tokens
- ✅ **SQL Injection Prevention** - Prisma ORM with parameterized queries
- ✅ **XSS Protection** - Helmet.js security headers
- ✅ **CORS** - Configurable cross-origin resource sharing
- ✅ **Rate Limiting** - Per-endpoint and per-user limits
- ✅ **Input Validation** - Zod validation on all endpoints

### Performance Features
- ✅ **Database Indexes** - Optimized queries
- ✅ **Connection Pooling** - Prisma connection management
- ✅ **Compression** - Gzip compression for responses
- ✅ **Query Optimization** - Efficient Prisma queries

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

API will be available at **http://localhost:4000**

## 📁 Project Structure

```
api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── config/                # Configuration
│   │   └── index.ts
│   ├── database/              # Database client
│   │   └── prisma.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.ts        # JWT authentication
│   │   ├── tenant.middleware.ts      # Multi-tenant isolation
│   │   ├── permission.middleware.ts  # RBAC permissions
│   │   ├── rateLimit.middleware.ts   # Rate limiting
│   │   ├── validation.middleware.ts  # Request validation
│   │   └── error.middleware.ts       # Error handling
│   ├── modules/               # Feature modules
│   │   └── auth/
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── auth.routes.ts
│   │       └── auth.validation.ts
│   ├── sockets/               # WebSocket server
│   │   └── index.ts
│   ├── utils/                 # Utilities
│   │   ├── logger.ts          # Winston logger
│   │   ├── password.ts        # bcrypt helpers
│   │   ├── jwt.ts             # JWT helpers
│   │   └── response.ts        # API response helpers
│   ├── server.ts              # Express server setup
│   └── index.ts               # Application entry point
├── .env.example               # Environment template
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| POST | `/api/v1/auth/refresh` | Refresh access token | Public |
| POST | `/api/v1/auth/logout` | Logout user | Public |
| GET | `/api/v1/auth/me` | Get current user | Private |

### Organizations (Coming Soon)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/organizations` | List organizations | Private |
| POST | `/api/v1/organizations` | Create organization | Private |
| GET | `/api/v1/organizations/:id` | Get organization | Private |
| PATCH | `/api/v1/organizations/:id` | Update organization | Private |

### Projects (Coming Soon)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/projects` | List projects | Private |
| POST | `/api/v1/projects` | Create project | Private |
| GET | `/api/v1/projects/:id` | Get project | Private |
| PATCH | `/api/v1/projects/:id` | Update project | Private |

### Tasks (Coming Soon)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/tasks` | List tasks | Private |
| POST | `/api/v1/tasks` | Create task | Private |
| GET | `/api/v1/tasks/:id` | Get task | Private |
| PATCH | `/api/v1/tasks/:id` | Update task | Private |
| DELETE | `/api/v1/tasks/:id` | Delete task | Private |

## 🔐 Authentication Flow

### Registration

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Using Access Token

```bash
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🔌 WebSocket Events

Connect to WebSocket server:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' },
});

// Join project room
socket.emit('join:project', { projectId: '123' });

// Listen for task updates
socket.on('task:updated', (data) => {
  console.log('Task updated:', data);
});
```

### Available Events

**Client → Server:**
- `join:project` - Join project room
- `leave:project` - Leave project room
- `join:task` - Join task room
- `leave:task` - Leave task room
- `user:typing` - Send typing indicator

**Server → Client:**
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `comment:added` - Comment added
- `user:joined` - User joined project
- `user:left` - User left project

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t taskflow-api .
docker run -p 4000:4000 --env-file .env taskflow-api
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://user:password@db-host:5432/taskflow
REDIS_URL=redis://redis-host:6379

JWT_SECRET=production-secret-here
JWT_REFRESH_SECRET=production-refresh-secret-here

CORS_ORIGIN=https://yourdomain.com

SENTRY_DSN=your-sentry-dsn
```

## 🔧 Database Management

### Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed

# Reset database (DEV ONLY)
npx prisma migrate reset
```

## 📊 Monitoring & Logging

### Logging

Logs are written to:
- Console (development)
- `logs/app.log` (all logs)
- `logs/error.log` (errors only)

### Health Check

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "development"
}
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Check Prisma Studio
npx prisma studio
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli ping
# Should return: PONG
```

### Port Already in Use

```bash
# Find process on port 4000
lsof -ti:4000 | xargs kill -9
```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📄 License

MIT License

---

**Built with ❤️ by the TaskFlow Team**
