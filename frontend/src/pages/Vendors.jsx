import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconTruck,
  IconPackage,
  IconAlertTriangle,
} from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import ModalForm from '../components/ModalForm'
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorProducts,
  getVendorOosProducts,
} from '../api/vendors'

const emptyVendor = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  gst: '',
  notes: '',
}

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [viewingVendor, setViewingVendor] = useState(null)
  const [formData, setFormData] = useState(emptyVendor)
  const [saving, setSaving] = useState(false)
  const [vendorProducts, setVendorProducts] = useState([])
  const [vendorOos, setVendorOos] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getVendors()
      const data = res.vendors || res.data || res || []
      setVendors(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleAdd = async () => {
    setSaving(true)
    try {
      await createVendor(formData)
      toast.success('Vendor added')
      setShowAddModal(false)
      setFormData(emptyVendor)
      fetchVendors()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingVendor) return
    setSaving(true)
    try {
      await updateVendor(editingVendor._id, formData)
      toast.success('Vendor updated')
      setShowEditModal(false)
      setEditingVendor(null)
      setFormData(emptyVendor)
      fetchVendors()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vendor) => {
    if (!window.confirm(`Delete vendor "${vendor.name}"?`)) return
    try {
      await deleteVendor(vendor._id)
      toast.success('Vendor deleted')
      fetchVendors()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleViewDetail = async (vendor) => {
    setViewingVendor(vendor)
    setShowDetailModal(true)
    setDetailLoading(true)
    try {
      const [products, oos] = await Promise.all([
        getVendorProducts(vendor._id),
        getVendorOosProducts(vendor._id),
      ])
      setVendorProducts(products.products || products.data || products || [])
      setVendorOos(oos.products || oos.data || oos || [])
    } catch (err) {
      toast.error(err.message)
      setVendorProducts([])
      setVendorOos([])
    } finally {
      setDetailLoading(false)
    }
  }

  const openEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name || '',
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      gst: vendor.gst || '',
      notes: vendor.notes || '',
    })
    setShowEditModal(true)
  }

  const columns = [
    { key: 'name', label: 'Vendor Name', render: (v, row) => (
      <div>
        <p className="text-gray-200 font-medium">{v}</p>
        <p className="text-xs text-gray-500">{row.contactPerson || ''}</p>
      </div>
    )},
    { key: 'phone', label: 'Contact', render: (v) => v || '-' },
    { key: 'email', label: 'Email', render: (v) => v ? <span className="text-xs text-gray-400">{v}</span> : '-' },
    { key: 'address', label: 'Address', render: (v) => v ? <span className="text-xs text-gray-400 truncate max-w-[150px] block">{v}</span> : '-' },
    { key: 'productCount', label: 'Products', render: (v, row) => (
      <span className="text-gray-300">{v || row.productsCount || row.products?.length || 0}</span>
    )},
    { key: '_id', label: 'Actions', render: (v, row) => (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); handleViewDetail(row) }}
          className="p-1.5 rounded-lg hover:bg-primary-500/10 text-primary-400"
          title="View Details"
        >
          <IconEye size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); openEdit(row) }}
          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400"
          title="Edit"
        >
          <IconEdit size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
          title="Delete"
        >
          <IconTrash size={16} />
        </button>
      </div>
    )},
  ]

  const renderForm = (isEdit = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Vendor Name *</label>
          <input className="input-glass" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="ABC Pharma" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Contact Person</label>
          <input className="input-glass" value={formData.contactPerson} onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))} placeholder="Mr. Sharma" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Phone *</label>
          <input className="input-glass" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input className="input-glass" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="vendor@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">GST No</label>
          <input className="input-glass" value={formData.gst} onChange={(e) => setFormData((p) => ({ ...p, gst: e.target.value }))} placeholder="07ABCDE1234F1Z5" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
          <textarea className="input-glass" rows={2} value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="123, Industrial Area" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea className="input-glass" rows={2} value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} placeholder="Payment terms, delivery notes..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingVendor(null); setFormData(emptyVendor) }} className="btn-secondary">Cancel</button>
        <button onClick={isEdit ? handleEdit : handleAdd} disabled={saving || !formData.name} className="btn-primary">
          {saving ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <IconTruck className="text-primary-400" size={24} />
            Vendors
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage your suppliers and distributors</p>
        </div>
        <button onClick={() => { setFormData(emptyVendor); setShowAddModal(true) }} className="btn-primary flex items-center gap-2">
          <IconPlus size={18} />
          Add Vendor
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={vendors} loading={loading} emptyMessage="No vendors added yet" />
      </div>

      <ModalForm isOpen={showAddModal} onClose={() => { setShowAddModal(false); setFormData(emptyVendor) }} title="Add New Vendor" size="lg">
        {renderForm(false)}
      </ModalForm>

      <ModalForm isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingVendor(null); setFormData(emptyVendor) }} title="Edit Vendor" size="lg">
        {renderForm(true)}
      </ModalForm>

      <ModalForm isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setViewingVendor(null) }} title={`Vendor Details - ${viewingVendor?.name || ''}`} size="lg">
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Vendor Info</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Contact</span><span className="text-gray-200">{viewingVendor?.contactPerson || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Phone</span><span className="text-gray-200">{viewingVendor?.phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="text-gray-200">{viewingVendor?.email || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">GST</span><span className="text-gray-200">{viewingVendor?.gst || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Address</span><span className="text-gray-200 text-right max-w-[200px]">{viewingVendor?.address || '-'}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-1.5">
                <IconPackage size={16} className="text-primary-400" />
                Products ({vendorProducts.length})
              </h3>
              {vendorProducts.length === 0 ? (
                <p className="text-sm text-gray-500">No products linked to this vendor</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {vendorProducts.map((p, i) => (
                    <div key={p._id || i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-200">{p.name || p.productName}</span>
                      <span className="text-xs text-gray-400">Stock: {p.stock || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-1.5">
                <IconAlertTriangle size={16} className="text-orange-400" />
                OOS Products ({vendorOos.length})
              </h3>
              {vendorOos.length === 0 ? (
                <p className="text-sm text-gray-500">No out-of-stock products</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {vendorOos.map((p, i) => (
                    <div key={p._id || i} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <span className="text-sm text-gray-200">{p.name || p.productName}</span>
                      <button className="text-xs text-primary-400 hover:text-primary-300" onClick={() => { setShowDetailModal(false); window.location.href = '/oos' }}>View</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ModalForm>
    </div>
  )
}
