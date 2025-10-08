'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Project, Task } from '@/types';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, List, Calendar, Settings, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRealtimeProject } from '@/hooks/useRealtime';

type ViewMode = 'board' | 'list' | 'timeline' | 'calendar';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  // Enable real-time updates for this project
  useRealtimeProject(projectId);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get<Task[]>(`/projects/${projectId}/tasks`),
  });

  if (projectLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'board' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('board')}
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          Board
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
        <Button
          variant={viewMode === 'timeline' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('timeline')}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Timeline
        </Button>
      </div>

      {/* Content */}
      {tasksLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'board' && tasks && <KanbanBoard tasks={tasks} projectId={projectId} />}
          {viewMode === 'list' && (
            <div className="rounded-lg border">
              <p className="p-8 text-center text-muted-foreground">List view coming soon</p>
            </div>
          )}
          {viewMode === 'timeline' && (
            <div className="rounded-lg border">
              <p className="p-8 text-center text-muted-foreground">Timeline view coming soon</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
