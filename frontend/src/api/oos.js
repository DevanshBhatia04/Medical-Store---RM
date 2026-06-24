import api from './axiosInstance'

export const getCurrent = async () => {
  const { data } = await api.get('/oos/current')
  return data
}

export const getHistory = async (params = {}) => {
  const { data } = await api.get('/oos/history', { params })
  return data
}

export const exportExcel = async () => {
  const { data } = await api.get('/oos/export', { responseType: 'blob' })
  return data
}

export const resolveOos = async (id) => {
  const { data } = await api.post(`/oos/resolve/${id}`)
  return data
}
