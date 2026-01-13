import { create } from "zustand";

interface CheckinState {
  isCheckinOpen: boolean;
  isCheckoutOpen: boolean;
  openCheckin: () => void;
  closeCheckin: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
}

export const useCheckinStore = create<CheckinState>((set) => ({
  isCheckinOpen: false,
  isCheckoutOpen: false,
  openCheckin: () => set({ isCheckinOpen: true }),
  closeCheckin: () => set({ isCheckinOpen: false }),
  openCheckout: () => set({ isCheckoutOpen: true }),
  closeCheckout: () => set({ isCheckoutOpen: false }),
}));
