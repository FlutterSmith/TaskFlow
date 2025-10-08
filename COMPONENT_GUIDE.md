# TaskFlow Component Reference Guide

Quick reference for using components in the TaskFlow application.

---

## 🎨 UI Components (shadcn/ui based)

### Button

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  New Task
</Button>
```

### Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="name@example.com"
    disabled={isLoading}
  />
</div>
```

### Textarea

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="Task description..."
  rows={4}
/>
```

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Task</DialogTitle>
      <DialogDescription>
        Fill in the details to create a new task
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Task Statistics</CardTitle>
    <CardDescription>Overview of your tasks</CardDescription>
  </CardHeader>
  <CardContent>
    <p>42 tasks completed this week</p>
  </CardContent>
</Card>
```

### Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">New</Badge>
<Badge variant="secondary">In Progress</Badge>
<Badge variant="destructive">Urgent</Badge>
<Badge variant="outline">Low Priority</Badge>
```

### Skeleton (Loading)

```tsx
import { Skeleton } from '@/components/ui/skeleton';

<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

## 🎯 Custom Components

### UserAvatar

```tsx
import { UserAvatar } from '@/components/shared/UserAvatar';

<UserAvatar
  user={{ name: 'John Doe', email: 'john@example.com', image: null }}
  size="sm" // sm | md | lg
  className="ring-2 ring-primary"
/>
```

### StatusBadge & PriorityBadge

```tsx
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';

<StatusBadge status="IN_PROGRESS" />
<PriorityBadge priority="HIGH" />
```

### TaskCard

```tsx
import { TaskCard } from '@/components/task/TaskCard';

<TaskCard task={taskObject} />
```

### KanbanBoard

```tsx
import { KanbanBoard } from '@/components/board/KanbanBoard';

<KanbanBoard tasks={tasks} projectId={projectId} />
```

### ErrorBoundary

```tsx
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

### PWAInstaller

```tsx
import { PWAInstaller } from '@/components/shared/PWAInstaller';

// Add to layout
<PWAInstaller />
```

---

## 🎣 Custom Hooks

### useKeyboardShortcuts

```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Use in layout or page
function MyPage() {
  useKeyboardShortcuts();
  // ...
}
```

### useRealtime

```tsx
import { useRealtimeProject, useRealtimeTask } from '@/hooks/useRealtime';

// For project updates
useRealtimeProject(projectId);

// For task updates
useRealtimeTask(taskId);
```

---

## 🗄️ State Management

### Zustand Stores

#### Auth Store

```tsx
import { useAuthStore } from '@/stores/authStore';

const { user, currentOrg, setUser, clearAuth } = useAuthStore();
```

#### UI Store

```tsx
import { useUIStore } from '@/stores/uiStore';

const {
  sidebarOpen,
  taskModalOpen,
  toggleSidebar,
  setTaskModalOpen,
  setCommandMenuOpen,
} = useUIStore();
```

#### Task Store

```tsx
import { useTaskStore } from '@/stores/taskStore';

const {
  tasks,
  currentView,
  filters,
  setTasks,
  updateTask,
  setCurrentView,
} = useTaskStore();
```

### React Query

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks', projectId],
  queryFn: () => api.get(`/projects/${projectId}/tasks`),
});

// Mutate data
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => api.post('/tasks', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

---

## 🎨 Styling Utilities

### cn() - Class Name Merger

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

### Common Utility Classes

```tsx
// Truncate text
<p className="truncate">Long text...</p>
<p className="truncate-2-lines">Multi-line text...</p>

// Transitions
<div className="transition-base">Smooth transition</div>

// Glass effect
<div className="glass">Glassmorphism</div>

// Gradients
<div className="gradient-primary">Blue gradient</div>
<div className="gradient-secondary">Purple gradient</div>
```

---

## 📝 Form Validation

### Using Zod with React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema } from '@/lib/validations';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(createTaskSchema),
});

const onSubmit = (data) => {
  // Data is validated
  console.log(data);
};

<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register('title')} />
  {errors.title && <span>{errors.title.message}</span>}
  <Button type="submit">Submit</Button>
</form>
```

---

## 🔌 API Client

### Making API Calls

```tsx
import { api } from '@/lib/api-client';

// GET request
const projects = await api.get('/projects');

// POST request
const newTask = await api.post('/tasks', {
  title: 'New Task',
  projectId: '123',
});

// PATCH request
await api.patch(`/tasks/${taskId}`, {
  status: 'DONE',
});

// DELETE request
await api.delete(`/tasks/${taskId}`);
```

---

## 🔄 Real-time Communication

### Socket.io

```tsx
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';

const socket = getSocket();

// Emit event
socket?.emit(SOCKET_EVENTS.JOIN_PROJECT, { projectId });

// Listen for events
socket?.on(SOCKET_EVENTS.TASK_UPDATED, (data) => {
  console.log('Task updated:', data);
});

// Cleanup
socket?.off(SOCKET_EVENTS.TASK_UPDATED);
```

---

## 🎨 Theme (Dark Mode)

```tsx
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();

<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle Theme
</Button>
```

---

## 🔐 Authentication

### NextAuth

```tsx
import { useSession, signIn, signOut } from 'next-auth/react';

const { data: session, status } = useSession();

// Sign in
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
});

// Sign out
await signOut({ callbackUrl: '/login' });
```

---

## 🧭 Navigation

```tsx
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Programmatic navigation
const router = useRouter();
router.push('/dashboard');

// Link component
<Link href="/projects">Projects</Link>
```

---

## 🎯 Common Patterns

### Loading State

```tsx
{isLoading ? (
  <Skeleton className="h-40 w-full" />
) : (
  <YourContent />
)}
```

### Empty State

```tsx
{items.length === 0 ? (
  <div className="py-12 text-center">
    <p className="text-muted-foreground">No items found</p>
    <Button className="mt-4">Create Item</Button>
  </div>
) : (
  <ItemsList items={items} />
)}
```

### Error State

```tsx
{error ? (
  <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
    <p className="text-sm text-destructive">{error.message}</p>
  </div>
) : (
  <YourContent />
)}
```

### Conditional Rendering

```tsx
{user && <UserMenu user={user} />}
{isAdmin && <AdminPanel />}
{status === 'loading' && <Spinner />}
```

---

## 📱 Responsive Design

```tsx
// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

// Hide/show on different screens
<div className="hidden lg:block">Desktop only</div>
<div className="block lg:hidden">Mobile only</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive heading
</h1>
```

---

## 🚀 Performance Tips

### Dynamic Imports

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton className="h-40" />,
  ssr: false, // Disable SSR if needed
});
```

### Memoization

```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize component
const TaskCard = memo(function TaskCard({ task }) {
  // ...
});

// Memoize value
const filteredTasks = useMemo(
  () => tasks.filter(t => t.status === 'TODO'),
  [tasks]
);

// Memoize function
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)

---

Happy coding! 🎉
