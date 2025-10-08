import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'query', emit: 'event' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Log events
prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query} ${e.params}`);
});

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message}`);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
