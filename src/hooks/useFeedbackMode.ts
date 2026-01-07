import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FeedbackModeStore {
  isEnabled: boolean;
  isSidebarOpen: boolean;
  setEnabled: (enabled: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useFeedbackMode = create<FeedbackModeStore>()(
  persist(
    (set) => ({
      isEnabled: false,
      isSidebarOpen: false,
      setEnabled: (enabled) => set({ isEnabled: enabled }),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: "feedback-mode-storage",
    }
  )
);
