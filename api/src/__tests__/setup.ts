import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up database before tests
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up database after tests
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Reset database state before each test
  // You might want to use a test database here
});

afterEach(async () => {
  // Clean up after each test
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/taskflow_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
