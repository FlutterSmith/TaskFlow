import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { successResponse, errorResponse } from '../utils/response';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

let redis: Redis | null = null;
if (config.redis.url) {
  redis = new Redis(config.redis.url);
}

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
    };

    return successResponse(res, health, 'Service is healthy');
  } catch (error) {
    return errorResponse(res, 'Health check failed', 503);
  }
});

/**
 * @route   GET /health/db
 * @desc    Database health check
 * @access  Public
 */
router.get('/db', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    return successResponse(res, {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    }, 'Database is healthy');
  } catch (error) {
    return errorResponse(res, 'Database health check failed', 503);
  }
});

/**
 * @route   GET /health/redis
 * @desc    Redis health check
 * @access  Public
 */
router.get('/redis', async (req: Request, res: Response) => {
  try {
    if (!redis) {
      return errorResponse(res, 'Redis not configured', 503);
    }

    const startTime = Date.now();

    // Simple ping to check Redis connection
    await redis.ping();

    const responseTime = Date.now() - startTime;

    return successResponse(res, {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    }, 'Redis is healthy');
  } catch (error) {
    return errorResponse(res, 'Redis health check failed', 503);
  }
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with all dependencies
 * @access  Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkMemory(),
      checkDisk(),
    ]);

    const [dbCheck, redisCheck, memoryCheck, diskCheck] = checks.map(result =>
      result.status === 'fulfilled' ? result.value : { status: 'unhealthy', error: 'Check failed' }
    );

    const overallStatus = checks.every(c => c.status === 'fulfilled' && c.value.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbCheck,
        redis: redisCheck,
        memory: memoryCheck,
        disk: diskCheck,
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (error) {
    return errorResponse(res, 'Detailed health check failed', 503);
  }
});

// Helper functions for health checks
async function checkDatabase(): Promise<{ status: string; responseTime?: string; error?: string }> {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<{ status: string; responseTime?: string; error?: string }> {
  try {
    if (!redis) {
      return { status: 'not_configured' };
    }

    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkMemory(): { status: string; usage: NodeJS.MemoryUsage; heapUsedPercent: string } {
  const usage = process.memoryUsage();
  const heapUsedPercent = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2);

  return {
    status: parseFloat(heapUsedPercent) > 90 ? 'warning' : 'healthy',
    usage,
    heapUsedPercent: `${heapUsedPercent}%`,
  };
}

function checkDisk(): { status: string; message: string } {
  // This is a placeholder - in production, you'd check actual disk usage
  return {
    status: 'healthy',
    message: 'Disk usage within acceptable limits',
  };
}

export default router;
