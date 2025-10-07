import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  taskModalOpen: boolean;
  selectedTaskId: string | null;
  commandMenuOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTaskModalOpen: (open: boolean, taskId?: string) => void;
  setCommandMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  taskModalOpen: false,
  selectedTaskId: null,
  commandMenuOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTaskModalOpen: (open, taskId) =>
    set({ taskModalOpen: open, selectedTaskId: taskId || null }),
  setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
}));
