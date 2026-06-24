import api from './axiosInstance'

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await api.put('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return data
}
