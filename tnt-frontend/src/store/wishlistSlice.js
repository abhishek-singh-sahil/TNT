import { createSlice } from '@reduxjs/toolkit'

const loadState = () => {
  try {
    const raw = localStorage.getItem('tnt_wishlist')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const persist = (items) => {
  try {
    localStorage.setItem('tnt_wishlist', JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: loadState() },
  reducers: {
    toggleWishlist(state, action) {
      const exists = state.items.find((i) => i.productId === action.payload.productId)
      if (exists) {
        state.items = state.items.filter((i) => i.productId !== action.payload.productId)
      } else {
        state.items.push(action.payload)
      }
      persist(state.items)
    },
    removeFromWishlist(state, action) {
      state.items = state.items.filter((i) => i.productId !== action.payload.productId)
      persist(state.items)
    },
  },
})

export const { toggleWishlist, removeFromWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
export const selectWishlistCount = (state) => state.wishlist.items.length
export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.items.some((i) => i.productId === productId)
