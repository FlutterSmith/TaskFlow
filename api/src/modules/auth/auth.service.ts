import prisma from '../../database/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/error.middleware';
import { addDays } from 'date-fns';

export class AuthService {
  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: addDays(new Date(), 7),
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
          take: 1,
        },
      },
    });

    if (!user || !user.password) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Get first organization (if any)
    const firstOrg = user.memberships[0];

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: firstOrg?.organizationId,
      role: firstOrg?.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: addDays(new Date(), 7),
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      accessToken,
      refreshToken,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            include: {
              memberships: {
                include: {
                  organization: true,
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID');
      }

      // Get first organization (if any)
      const firstOrg = storedToken.user.memberships[0];

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        organizationId: firstOrg?.organizationId,
        role: firstOrg?.role,
      });

      return {
        accessToken,
        refreshToken, // Return same refresh token
      };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID');
    }
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}
