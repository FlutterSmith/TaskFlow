'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types';
import { SortableTaskCard } from '../task/SortableTaskCard';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoardColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export function BoardColumn({ id, title, tasks }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex min-w-[300px] flex-col rounded-lg border bg-muted/50">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {tasks.length}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 p-4 transition-colors',
          isOver && 'bg-accent/50'
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-sm text-muted-foreground">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}
