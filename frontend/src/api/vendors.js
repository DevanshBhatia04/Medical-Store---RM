import api from './axiosInstance'

export const getVendors = async () => {
  const { data } = await api.get('/vendors')
  return data
}

export const getVendor = async (id) => {
  const { data } = await api.get(`/vendors/${id}`)
  return data
}

export const createVendor = async (vendorData) => {
  const { data } = await api.post('/vendors', vendorData)
  return data
}

export const updateVendor = async (id, vendorData) => {
  const { data } = await api.put(`/vendors/${id}`, vendorData)
  return data
}

export const deleteVendor = async (id) => {
  const { data } = await api.delete(`/vendors/${id}`)
  return data
}

export const getVendorProducts = async (id) => {
  const { data } = await api.get(`/vendors/${id}/products`)
  return data
}

export const getVendorOosProducts = async (id) => {
  const { data } = await api.get(`/vendors/${id}/oos-products`)
  return data
}
