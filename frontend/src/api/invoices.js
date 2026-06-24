import api from './axiosInstance'

export const getInvoices = async (params = {}) => {
  const { data } = await api.get('/invoices', { params })
  return data
}

export const getInvoice = async (id) => {
  const { data } = await api.get(`/invoices/${id}`)
  return data
}

export const createInvoice = async (invoiceData) => {
  const { data } = await api.post('/invoices', invoiceData)
  return data
}
