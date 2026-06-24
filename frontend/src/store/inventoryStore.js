import { create } from 'zustand'

export const useInventoryStore = create((set) => ({
  products: [],
  filters: {
    search: '',
    category: '',
    stockStatus: '',
    page: 1,
    limit: 20,
    total: 0,
  },
  cart: [],

  setProducts: (products, total) =>
    set((state) => ({
      products,
      filters: { ...state.filters, total },
    })),

  setFilters: (filterUpdate) =>
    set((state) => ({
      filters: { ...state.filters, ...filterUpdate },
    })),

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item._id === product._id)
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item._id === product._id
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        }
      }
      return { cart: [...state.cart, { ...product, qty: 1 }] }
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item._id !== productId),
    })),

  updateCartQty: (productId, qty) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item._id === productId ? { ...item, qty: Math.max(0, qty) } : item
      ),
    })),

  clearCart: () => set({ cart: [] }),
}))
