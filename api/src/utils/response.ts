import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const successResponse = <T>(res: Response, data: T, statusCode = 200): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: code || 'ERROR',
      message,
      details,
    },
  };
  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const totalPages = Math.ceil(total / limit);
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
  return res.status(200).json(response);
};
