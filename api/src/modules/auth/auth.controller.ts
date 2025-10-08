import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      const result = await authService.register(name, email, password);

      successResponse(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshAccessToken(refreshToken);

      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await authService.logout(refreshToken);

      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const user = await authService.getCurrentUser(req.user.userId);

      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }
}
