import { create } from 'zustand'

const storedUser = localStorage.getItem('medstore_user')
const storedToken = localStorage.getItem('medstore_token')

export const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,

  login: (userData, token) => {
    localStorage.setItem('medstore_token', token)
    localStorage.setItem('medstore_user', JSON.stringify(userData))
    set({ user: userData, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('medstore_token')
    localStorage.removeItem('medstore_user')
    set({ user: null, token: null, isAuthenticated: false })
    window.location.href = '/login'
  },

  updateUser: (userData) => {
    localStorage.setItem('medstore_user', JSON.stringify(userData))
    set({ user: userData })
  },
}))
