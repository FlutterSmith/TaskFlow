import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';
import { Task, Comment } from '@/types';
import toast from 'react-hot-toast';

export function useRealtimeTask(taskId?: string) {
  const queryClient = useQueryClient();
  const socket = getSocket();

  useEffect(() => {
    if (!socket || !taskId) return;

    // Join task room
    socket.emit(SOCKET_EVENTS.JOIN_TASK, { taskId });

    // Listen for task updates
    const handleTaskUpdate = (data: { task: Task }) => {
      queryClient.setQueryData(['task', taskId], data.task);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    const handleCommentAdded = (data: { comment: Comment }) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    };

    socket.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdate);
    socket.on(SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_TASK, { taskId });
      socket.off(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdate);
      socket.off(SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);
    };
  }, [socket, taskId, queryClient]);
}

export function useRealtimeProject(projectId?: string) {
  const queryClient = useQueryClient();
  const socket = getSocket();

  useEffect(() => {
    if (!socket || !projectId) return;

    // Join project room
    socket.emit(SOCKET_EVENTS.JOIN_PROJECT, { projectId });

    const handleTaskCreated = (data: { task: Task }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(`New task created: ${data.task.title}`);
    };

    const handleTaskUpdated = (data: { task: Task }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.setQueryData(['task', data.task.id], data.task);
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.removeQueries({ queryKey: ['task', data.taskId] });
    };

    socket.on(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
    socket.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
    socket.on(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_PROJECT, { projectId });
      socket.off(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
      socket.off(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
      socket.off(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
    };
  }, [socket, projectId, queryClient]);
}

export function usePresence(projectId?: string) {
  const socket = getSocket();

  const emitTyping = useCallback(
    (taskId: string) => {
      if (socket && projectId) {
        socket.emit(SOCKET_EVENTS.USER_TYPING, { projectId, taskId });
      }
    },
    [socket, projectId]
  );

  return { emitTyping };
}
