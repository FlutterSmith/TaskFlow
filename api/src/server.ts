import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './config/sentry';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import healthRoutes from './routes/health.routes';
// Import more routes as they're created
// import organizationRoutes from './modules/organizations/organization.routes';
// import projectRoutes from './modules/projects/project.routes';
// import taskRoutes from './modules/tasks/task.routes';

export function createServer(): Application {
  const app = express();

  // Sentry request handler (must be first)
  app.use(sentryRequestHandler());

  // Sentry tracing middleware
  app.use(sentryTracingHandler());

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Logging
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => logger.http(message.trim()),
        },
      })
    );
  }

  // Rate limiting
  app.use(generalLimiter);

  // Health check routes
  app.use('/health', healthRoutes);

  // API Routes
  const apiRouter = express.Router();

  apiRouter.get('/', (req, res) => {
    res.json({
      message: 'TaskFlow API',
      version: config.apiVersion,
      documentation: '/api-docs',
    });
  });

  // Mount API routes
  apiRouter.use('/auth', authRoutes);
  // apiRouter.use('/organizations', organizationRoutes);
  // apiRouter.use('/projects', projectRoutes);
  // apiRouter.use('/tasks', taskRoutes);

  app.use(`/api/${config.apiVersion}`, apiRouter);

  // Error handling
  app.use(notFoundHandler);

  // Sentry error handler (must be before other error handlers)
  app.use(sentryErrorHandler());

  app.use(errorHandler);

  return app;
}
