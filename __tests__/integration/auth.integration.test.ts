import request from 'supertest';
import { createServer } from '@/server';
import { prisma } from '@/lib/prisma';
import { hash} from 'bcrypt';

describe('Authentication Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = createServer();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          user: {
            id: expect.any(String),
            name: userData.name,
            email: userData.email,
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.password).not.toBe(userData.password); // Password should be hashed
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.error).toMatch(/email/i);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body.error).toMatch(/password/i);
    });

    it('should return 409 for duplicate email', async () => {
      // Create existing user
      const hashedPassword = await hash('Password123!', 12);
      await prisma.user.create({
        data: {
          name: 'Existing User',
          email: 'existing@example.com',
          password: hashedPassword,
        },
      });

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'Password123!',
        })
        .expect(409);

      expect(response.body.error).toMatch(/already exists/i);
    });

    it('should sanitize user input', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(201);

      // Name should be sanitized
      expect(response.body.data.user.name).not.toContain('<script>');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await hash('Password123!', 12);
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        user: {
          email: 'test@example.com',
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // Verify refresh token was stored
      const refreshToken = await prisma.refreshToken.findFirst({
        where: { token: response.body.data.refreshToken },
      });
      expect(refreshToken).toBeTruthy();
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    it('should implement rate limiting', async () => {
      // Make multiple failed login attempts
      const attempts = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      await Promise.all(attempts);

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(429);

      expect(response.body.error).toMatch(/too many/i);
    });

    it('should set secure HTTP-only cookies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/HttpOnly/);
      expect(cookies[0]).toMatch(/Secure/);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create user and refresh token
      const hashedPassword = await hash('Password123!', 12);
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });

      userId = user.id;

      const token = await prisma.refreshToken.create({
        data: {
          token: 'valid-refresh-token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      refreshToken = token.token;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // New refresh token should be different
      expect(response.body.data.refreshToken).not.toBe(refreshToken);

      // Old refresh token should be deleted
      const oldToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(oldToken).toBeNull();
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toMatch(/invalid/i);
    });

    it('should return 401 for expired refresh token', async () => {
      // Create expired token
      const expiredToken = await prisma.refreshToken.create({
        data: {
          token: 'expired-token',
          userId,
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredToken.token })
        .expect(401);

      expect(response.body.error).toMatch(/expired/i);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create user and login
      const hashedPassword = await hash('Password123!', 12);
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });

      userId = user.id;

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      accessToken = response.body.data.accessToken;
    });

    it('should logout and invalidate refresh tokens', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify all refresh tokens for user are deleted
      const tokens = await prisma.refreshToken.findMany({
        where: { userId },
      });
      expect(tokens).toHaveLength(0);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.error).toMatch(/unauthorized/i);
    });
  });

  describe('POST /api/v1/auth/password-reset/request', () => {
    beforeEach(async () => {
      const hashedPassword = await hash('Password123!', 12);
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });
    });

    it('should send password reset email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).toMatch(/reset link sent/i);

      // Verify reset token was created
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: { user: { email: 'test@example.com' } },
      });
      expect(resetToken).toBeTruthy();
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return same message for security
      expect(response.body.message).toMatch(/reset link sent/i);
    });

    it('should rate limit reset requests', async () => {
      // Make multiple requests
      const requests = Array(4).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/password-reset/request')
          .send({ email: 'test@example.com' })
      );

      await Promise.all(requests);

      // Next request should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'test@example.com' })
        .expect(429);

      expect(response.body.error).toMatch(/too many/i);
    });
  });

  describe('POST /api/v1/auth/password-reset/confirm', () => {
    let resetToken: string;

    beforeEach(async () => {
      const hashedPassword = await hash('OldPassword123!', 12);
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });

      const token = await prisma.passwordResetToken.create({
        data: {
          token: 'valid-reset-token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
      });

      resetToken = token.token;
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123!';

      await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      // Verify password was changed
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(user?.password).not.toBe(await hash('OldPassword123!', 12));

      // Verify user can login with new password
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: newPassword,
        });

      expect(response.status).toBe(200);
    });

    it('should return 401 for expired reset token', async () => {
      // Create expired token
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      const expiredToken = await prisma.passwordResetToken.create({
        data: {
          token: 'expired-token',
          userId: user!.id,
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: expiredToken.token,
          password: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.error).toMatch(/expired/i);
    });

    it('should invalidate reset token after use', async () => {
      await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
        });

      // Token should be deleted
      const token = await prisma.passwordResetToken.findUnique({
        where: { token: resetToken },
      });
      expect(token).toBeNull();

      // Should not be able to reuse token
      const response = await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: resetToken,
          password: 'AnotherPassword123!',
        })
        .expect(401);

      expect(response.body.error).toMatch(/invalid/i);
    });
  });
});
