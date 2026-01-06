import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimeTrackerState {
  isOpen: boolean;
  isMinimized: boolean;
  isRunning: boolean;
  elapsedSeconds: number;
  projectId: string | null;
  projectName: string | null;
  description: string;
  startedAt: Date | null;
  
  // Actions
  openTracker: (projectId?: string, projectName?: string) => void;
  closeTracker: () => void;
  toggleMinimize: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  setDescription: (description: string) => void;
  setProject: (projectId: string | null, projectName?: string | null) => void;
  reset: () => void;
}

export const useTimeTrackerStore = create<TimeTrackerState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      isRunning: false,
      elapsedSeconds: 0,
      projectId: null,
      projectName: null,
      description: '',
      startedAt: null,

      openTracker: (projectId?: string, projectName?: string) => {
        set({
          isOpen: true,
          isMinimized: false,
          projectId: projectId || null,
          projectName: projectName || null,
        });
      },

      closeTracker: () => {
        const { isRunning } = get();
        if (!isRunning) {
          set({ isOpen: false, isMinimized: false });
        } else {
          set({ isMinimized: true });
        }
      },

      toggleMinimize: () => {
        set((state) => ({ isMinimized: !state.isMinimized }));
      },

      startTimer: () => {
        set({
          isRunning: true,
          startedAt: new Date(),
          elapsedSeconds: 0,
        });
      },

      stopTimer: () => {
        set({ isRunning: false });
      },

      tick: () => {
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
      },

      setDescription: (description: string) => {
        set({ description });
      },

      setProject: (projectId: string | null, projectName?: string | null) => {
        set({ projectId, projectName: projectName || null });
      },

      reset: () => {
        set({
          isRunning: false,
          elapsedSeconds: 0,
          description: '',
          startedAt: null,
        });
      },
    }),
    {
      name: 'time-tracker-storage',
      partialize: (state) => ({
        isOpen: state.isOpen,
        isMinimized: state.isMinimized,
        isRunning: state.isRunning,
        elapsedSeconds: state.elapsedSeconds,
        projectId: state.projectId,
        projectName: state.projectName,
        description: state.description,
        startedAt: state.startedAt,
      }),
    }
  )
);
