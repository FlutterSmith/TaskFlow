import { create } from 'zustand';
import { Task, TaskStatus, ViewType, TaskFilters } from '@/types';

interface TaskState {
  tasks: Task[];
  currentView: ViewType;
  filters: TaskFilters;
  selectedTasks: string[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  setCurrentView: (view: ViewType) => void;
  setFilters: (filters: TaskFilters) => void;
  toggleTaskSelection: (taskId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentView: 'LIST',
  filters: {},
  selectedTasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    })),
  removeTask: (taskId) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),
  setCurrentView: (view) => set({ currentView: view }),
  setFilters: (filters) => set({ filters }),
  toggleTaskSelection: (taskId) =>
    set((state) => ({
      selectedTasks: state.selectedTasks.includes(taskId)
        ? state.selectedTasks.filter((id) => id !== taskId)
        : [...state.selectedTasks, taskId],
    })),
  clearSelection: () => set({ selectedTasks: [] }),
  selectAll: () => set((state) => ({ selectedTasks: state.tasks.map((t) => t.id) })),
}));
