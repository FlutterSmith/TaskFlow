'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from '../task/TaskCard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import toast from 'react-hot-toast';

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'IN_REVIEW', title: 'In Review' },
  { id: 'DONE', title: 'Done' },
];

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
}

export function KanbanBoard({ tasks: initialTasks, projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api.patch(`/tasks/${taskId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task moved successfully');
    },
    onError: (error) => {
      toast.error('Failed to move task');
      // Revert optimistic update
      setTasks(initialTasks);
    },
  });

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status).sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask) return;

    const activeStatus = activeTask.status;
    const overStatus = overTask?.status || (overId as TaskStatus);

    if (activeStatus === overStatus) return;

    setTasks((tasks) => {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = overTask ? tasks.findIndex((t) => t.id === overId) : -1;

      const updatedTasks = [...tasks];
      updatedTasks[activeIndex] = { ...updatedTasks[activeIndex], status: overStatus };

      if (overIndex !== -1) {
        return arrayMove(updatedTasks, activeIndex, overIndex);
      }

      return updatedTasks;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask) return;

    const newStatus = overTask?.status || (overId as TaskStatus);

    if (activeTask.status !== newStatus) {
      // Optimistic update
      updateTaskMutation.mutate({ taskId: activeTask.id, status: newStatus });
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksByStatus(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 cursor-grabbing opacity-80">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
