import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export const shortcuts: ShortcutConfig[] = [
  {
    key: 'k',
    meta: true,
    ctrl: true,
    description: 'Open command menu',
    action: () => {},
  },
  {
    key: 'n',
    meta: true,
    ctrl: true,
    description: 'Create new task',
    action: () => {},
  },
  {
    key: 'b',
    meta: true,
    ctrl: true,
    description: 'Toggle sidebar',
    action: () => {},
  },
  {
    key: '/',
    description: 'Focus search',
    action: () => {},
  },
];

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { setCommandMenuOpen, toggleSidebar, setTaskModalOpen } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Command Menu (Cmd/Ctrl + K)
      if (modKey && e.key === 'k') {
        e.preventDefault();
        setCommandMenuOpen(true);
        return;
      }

      // New Task (Cmd/Ctrl + N)
      if (modKey && e.key === 'n') {
        e.preventDefault();
        setTaskModalOpen(true);
        return;
      }

      // Toggle Sidebar (Cmd/Ctrl + B)
      if (modKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Navigate to Dashboard (G then D)
      if (e.key === 'g') {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === 'd') {
            router.push('/dashboard');
          } else if (e2.key === 'p') {
            router.push('/projects');
          } else if (e2.key === 't') {
            router.push('/tasks');
          }
          document.removeEventListener('keydown', handleSecondKey);
        };
        document.addEventListener('keydown', handleSecondKey, { once: true });
        return;
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        setTaskModalOpen(false);
        setCommandMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, setCommandMenuOpen, toggleSidebar, setTaskModalOpen]);
}
