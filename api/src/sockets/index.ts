import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { config } from '../config';

export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_MOVED: 'task:moved',

  // Comment events
  COMMENT_ADDED: 'comment:added',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',

  // Presence events
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  USER_TYPING: 'user:typing',

  // Project events
  PROJECT_UPDATED: 'project:updated',

  // Room management
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',
  JOIN_TASK: 'join:task',
  LEAVE_TASK: 'leave:task',
} as const;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

export function initializeSocketServer(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.email = payload.email;

      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join project room
    socket.on(SOCKET_EVENTS.JOIN_PROJECT, ({ projectId }) => {
      socket.join(`project:${projectId}`);
      logger.debug(`User ${socket.userId} joined project:${projectId}`);

      // Broadcast user joined to others in the room
      socket.to(`project:${projectId}`).emit(SOCKET_EVENTS.USER_JOINED, {
        userId: socket.userId,
        projectId,
      });
    });

    // Leave project room
    socket.on(SOCKET_EVENTS.LEAVE_PROJECT, ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      logger.debug(`User ${socket.userId} left project:${projectId}`);

      socket.to(`project:${projectId}`).emit(SOCKET_EVENTS.USER_LEFT, {
        userId: socket.userId,
        projectId,
      });
    });

    // Join task room
    socket.on(SOCKET_EVENTS.JOIN_TASK, ({ taskId }) => {
      socket.join(`task:${taskId}`);
      logger.debug(`User ${socket.userId} joined task:${taskId}`);
    });

    // Leave task room
    socket.on(SOCKET_EVENTS.LEAVE_TASK, ({ taskId }) => {
      socket.leave(`task:${taskId}`);
      logger.debug(`User ${socket.userId} left task:${taskId}`);
    });

    // Handle typing indicator
    socket.on(SOCKET_EVENTS.USER_TYPING, ({ projectId, taskId }) => {
      socket.to(`task:${taskId}`).emit(SOCKET_EVENTS.USER_TYPING, {
        userId: socket.userId,
        projectId,
        taskId,
      });
    });

    // Disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${socket.userId})`);
    });
  });

  logger.info('✅ Socket.IO server initialized');

  return io;
}

// Helper function to emit events to specific rooms
export function emitToProject(io: Server, projectId: string, event: string, data: any) {
  io.to(`project:${projectId}`).emit(event, data);
}

export function emitToTask(io: Server, taskId: string, event: string, data: any) {
  io.to(`task:${taskId}`).emit(event, data);
}
