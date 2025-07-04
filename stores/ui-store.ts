import { create } from "zustand"

interface UIState {
  isLoading: boolean
  cartCount: number
  setLoading: (loading: boolean) => void
  incrementCart: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: true,
  cartCount: 0,
  setLoading: (loading) => set({ isLoading: loading }),
  incrementCart: () => set((state) => ({ cartCount: state.cartCount + 1 })),
}))
