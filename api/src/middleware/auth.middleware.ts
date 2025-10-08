import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId?: string;
    role?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'No authorization token provided', 401, 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      errorResponse(res, 'Invalid or expired token', 401, 'TOKEN_INVALID');
      return;
    }
  } catch (error) {
    errorResponse(res, 'Authentication failed', 500, 'AUTH_ERROR');
    return;
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token invalid, but continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};
