import { createServer as createHTTPServer } from 'http';
import { createServer } from './server';
import { initializeSocketServer } from './sockets';
import { config, isDev } from './config';
import { logger } from './utils/logger';
import prisma from './database/prisma';
import { initializeSentry } from './config/sentry';

async function startServer() {
  try {
    // Initialize Sentry for error tracking
    initializeSentry();

    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Create Express app
    const app = createServer();

    // Create HTTP server
    const httpServer = createHTTPServer(app);

    // Initialize Socket.IO
    initializeSocketServer(httpServer);

    // Start server
    httpServer.listen(config.port, () => {
      logger.info(`
      ╔════════════════════════════════════════╗
      ║                                        ║
      ║   🚀 TaskFlow API Server Running      ║
      ║                                        ║
      ║   Environment: ${config.env.padEnd(22)}║
      ║   Port:        ${config.port.toString().padEnd(22)}║
      ║   API Version: ${config.apiVersion.padEnd(22)}║
      ║                                        ║
      ║   http://localhost:${config.port}           ║
      ║   Health: /health                      ║
      ║   API Docs: /api-docs                  ║
      ║                                        ║
      ╚════════════════════════════════════════╝
      `);

      if (isDev) {
        logger.info(`
      📝 Development mode enabled
      📊 Prisma Studio: npx prisma studio
      🔍 API Explorer: http://localhost:${config.port}/api/${config.apiVersion}
        `);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await prisma.$disconnect();
      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await prisma.$disconnect();
      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
