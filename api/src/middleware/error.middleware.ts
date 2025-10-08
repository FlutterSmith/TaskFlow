import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, url: req.url });

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      errorResponse(res, 'Unique constraint violation', 409, 'DUPLICATE_ENTRY');
      return;
    }
    if (err.code === 'P2025') {
      errorResponse(res, 'Record not found', 404, 'NOT_FOUND');
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    errorResponse(res, 'Invalid data provided', 400, 'VALIDATION_ERROR');
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    errorResponse(res, err.message, err.statusCode, err.code);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse(res, 'Invalid token', 401, 'TOKEN_INVALID');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    return;
  }

  // Default error
  errorResponse(res, 'Internal server error', 500, 'INTERNAL_ERROR');
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, `Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
};
