import { create } from "zustand"
import type { Look } from "@/types/look"
import { useUIStore } from "./ui-store"

interface LookState {
  looks: Look[]
  addToCart: (look: Look) => void
}

export const useLookStore = create<LookState>((set, get) => ({
  looks: [],
  addToCart: (look) => {
    set((state) => ({
      looks: [...state.looks, look],
    }))
    useUIStore.getState().incrementCart()
  },
}))
