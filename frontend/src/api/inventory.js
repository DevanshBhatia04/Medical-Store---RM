import api from './axiosInstance'

export const getProducts = async (params = {}) => {
  const { data } = await api.get('/inventory', { params })
  return data
}

export const getProduct = async (id) => {
  const { data } = await api.get(`/inventory/${id}`)
  return data
}

export const createProduct = async (productData) => {
  const { data } = await api.post('/inventory', productData)
  return data
}

export const updateProduct = async (id, productData) => {
  const { data } = await api.put(`/inventory/${id}`, productData)
  return data
}

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/inventory/${id}`)
  return data
}

export const getByBarcode = async (code) => {
  const { data } = await api.get(`/inventory/barcode/${code}`)
  return data
}

export const lookupBarcode = async (code) => {
  const { data } = await api.get(`/barcode/lookup/${code}`)
  return data
}

export const stockAdjust = async (adjustData) => {
  const { data } = await api.post('/inventory/stock-adjust', adjustData)
  return data
}
