'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Settings,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'My Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();
  const { currentOrg, organizations } = useAuthStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r bg-background transition-transform lg:relative lg:translate-x-0">
      <div className="flex h-full flex-col">
        {/* Logo & Org Switcher */}
        <div className="border-b p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600" />
            <span className="text-lg font-bold">TaskFlow</span>
          </Link>

          {/* Organization Switcher */}
          {currentOrg && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="mt-4 w-full justify-between">
                  <span className="truncate">{currentOrg.name}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {organizations.map((org) => (
                  <DropdownMenuItem key={org.id}>
                    <span className="truncate">{org.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem>
                  <Plus className="mr-2 h-4 w-4" />
                  Create organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="border-t p-4">
          <Button className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>
    </aside>
  );
}
