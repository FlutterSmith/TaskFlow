'use client';

import { Badge } from '@/components/ui/badge';
import { TaskStatus, Priority } from '@/types';
import { cn } from '@/lib/utils';

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  IN_REVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  BLOCKED: 'Blocked',
  DONE: 'Done',
  ARCHIVED: 'Archived',
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusColors[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge variant="outline" className={cn(priorityColors[priority], className)}>
      {priorityLabels[priority]}
    </Badge>
  );
}
