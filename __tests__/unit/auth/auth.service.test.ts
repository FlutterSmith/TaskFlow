import { AuthService } from '@/services/auth.service';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/password');
jest.mock('@/lib/jwt');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      };

      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: '1',
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (generateAccessToken as jest.Mock).mockReturnValue('access_token');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh_token');

      // Act
      const result = await authService.register(
        userData.name,
        userData.email,
        userData.password
      );

      // Assert
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
      });
      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          email: userData.email,
        }),
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const existingUser = {
        id: '1',
        email: 'john@example.com',
        password: 'hashed',
        name: 'John',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(
        authService.register('John', 'john@example.com', 'Password123!')
      ).rejects.toThrow('Email already exists');

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const invalidEmail = 'not-an-email';

      // Act & Assert
      await expect(
        authService.register('John', invalidEmail, 'Password123!')
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const weakPassword = '123';

      // Act & Assert
      await expect(
        authService.register('John', 'john@example.com', weakPassword)
      ).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'john@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: '1',
        email: credentials.email,
        password: 'hashed_password',
        name: 'John',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (generateAccessToken as jest.Mock).mockReturnValue('access_token');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh_token');

      // Act
      const result = await authService.login(
        credentials.email,
        credentials.password
      );

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
      expect(comparePassword).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          email: credentials.email,
        }),
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for incorrect password', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'john@example.com',
        password: 'hashed_password',
        name: 'John',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login('john@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should implement rate limiting after failed attempts', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'john@example.com',
        password: 'hashed_password',
        failedLoginAttempts: 5,
        lockUntil: new Date(Date.now() + 3600000),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        authService.login('john@example.com', 'password')
      ).rejects.toThrow('Account locked due to too many failed attempts');
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid_refresh_token';
      const userId = '1';

      const mockRefreshToken = {
        id: '1',
        token: refreshToken,
        userId: userId,
        expiresAt: new Date(Date.now() + 86400000),
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockRefreshToken
      );
      (generateAccessToken as jest.Mock).mockReturnValue('new_access_token');
      (generateRefreshToken as jest.Mock).mockReturnValue('new_refresh_token');

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });

    it('should throw error for expired refresh token', async () => {
      // Arrange
      const expiredToken = {
        id: '1',
        token: 'expired_token',
        userId: '1',
        expiresAt: new Date(Date.now() - 86400000), // Expired
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        expiredToken
      );

      // Act & Assert
      await expect(
        authService.refreshToken('expired_token')
      ).rejects.toThrow('Refresh token expired');
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.refreshToken('invalid_token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should delete refresh token on logout', async () => {
      // Arrange
      const userId = '1';

      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      // Act
      await authService.logout(userId);

      // Assert
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should handle logout when no tokens exist', async () => {
      // Arrange
      const userId = '1';

      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      // Act & Assert
      await expect(authService.logout(userId)).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      // Arrange
      const email = 'john@example.com';
      const mockUser = {
        id: '1',
        email,
        name: 'John',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await authService.requestPasswordReset(email);

      // Assert
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: '1',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should not reveal if email does not exist', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.requestPasswordReset('nonexistent@example.com')
      ).resolves.not.toThrow();

      // Should not create reset token
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
      // Arrange
      const token = 'valid_reset_token';
      const newPassword = 'NewPassword123!';
      const hashedPassword = 'new_hashed_password';

      const mockResetToken = {
        id: '1',
        token,
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000),
      };

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        mockResetToken
      );
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      // Act
      await authService.resetPassword(token, newPassword);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { password: hashedPassword },
      });
      expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw error for expired reset token', async () => {
      // Arrange
      const expiredToken = {
        id: '1',
        token: 'expired_token',
        userId: '1',
        expiresAt: new Date(Date.now() - 3600000),
      };

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        expiredToken
      );

      // Act & Assert
      await expect(
        authService.resetPassword('expired_token', 'NewPassword123!')
      ).rejects.toThrow('Password reset token expired');
    });
  });
});
