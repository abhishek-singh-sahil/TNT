import { createSlice } from '@reduxjs/toolkit'

const loadState = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const initialState = {
  items: loadState('tnt_cart', []), // {productId, variantId, name, image, price, color, size, qty}
}

const persist = (items) => {
  try {
    localStorage.setItem('tnt_cart', JSON.stringify(items))
  } catch {
    /* ignore quota errors */
  }
}

const findIndex = (items, action) =>
  items.findIndex(
    (i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId
  )

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      const idx = findIndex(state.items, action)
      if (idx > -1) {
        state.items[idx].qty += action.payload.qty || 1
      } else {
        state.items.push({ ...action.payload, qty: action.payload.qty || 1 })
      }
      persist(state.items)
    },
    removeItem(state, action) {
      state.items = state.items.filter(
        (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
      )
      persist(state.items)
    },
    updateQty(state, action) {
      const idx = findIndex(state.items, action)
      if (idx > -1) {
        state.items[idx].qty = Math.max(1, action.payload.qty)
      }
      persist(state.items)
    },
    clearCart(state) {
      state.items = []
      persist(state.items)
    },
  },
})

export const { addItem, removeItem, updateQty, clearCart } = cartSlice.actions
export default cartSlice.reducer

export const selectCartCount = (state) => state.cart.items.reduce((n, i) => n + i.qty, 0)
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0)
