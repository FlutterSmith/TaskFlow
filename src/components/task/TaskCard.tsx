'use client';

import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Calendar, MessageSquare, Paperclip } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { setTaskModalOpen } = useUIStore();

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setTaskModalOpen(true, task.id)}
    >
      <CardContent className="p-4">
        {/* Task number and priority */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {task.project?.key}-{task.taskNumber}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Title */}
        <h4 className="mb-2 font-medium line-clamp-2">{task.title}</h4>

        {/* Description preview */}
        {task.description && (
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate, 'MMM d')}</span>
            </div>
          )}
          {(task.comments?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comments?.length}</span>
            </div>
          )}
          {(task.attachments?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments?.length}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {task.assignees.slice(0, 3).map((assignee) => (
              <UserAvatar key={assignee.id} user={assignee.user} size="sm" className="ring-2 ring-background" />
            ))}
            {task.assignees.length > 3 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs ring-2 ring-background">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
