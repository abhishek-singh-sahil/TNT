import { createSlice } from '@reduxjs/toolkit'

const loadUser = () => {
  try {
    const raw = localStorage.getItem('tnt_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: loadUser(),
    accessToken: localStorage.getItem('tnt_access_token') || null,
  },
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      localStorage.setItem('tnt_user', JSON.stringify(action.payload.user))
      localStorage.setItem('tnt_access_token', action.payload.accessToken)
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      localStorage.removeItem('tnt_user')
      localStorage.removeItem('tnt_access_token')
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('tnt_user', JSON.stringify(state.user))
    },
  },
})

export const { setCredentials, logout, updateUser } = authSlice.actions
export default authSlice.reducer
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken)
