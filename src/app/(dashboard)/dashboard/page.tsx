'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { Task } from '@/types';
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats'),
  });

  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: () => api.get<Task[]>('/tasks/recent'),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your tasks and projects.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          loading={statsLoading}
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgress || 0}
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          loading={statsLoading}
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          loading={statsLoading}
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue || 0}
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          loading={statsLoading}
        />
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentTasks && recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.project?.name} • {formatRelativeTime(task.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No recent tasks</p>
              <Link href="/projects">
                <Button className="mt-4">Create your first task</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
