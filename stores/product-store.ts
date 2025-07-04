import { create } from "zustand"
import type { Product } from "@/types/product"
import { useUIStore } from "./ui-store"

interface ProductState {
  products: Product[]
  addToCart: (product: Product) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  addToCart: (product) => {
    set((state) => ({
      products: [...state.products, product],
    }))
    useUIStore.getState().incrementCart()
  },
}))
