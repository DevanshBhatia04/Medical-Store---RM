import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPackage,
  IconBarcode,
  IconAdjustments,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import ModalForm from '../components/ModalForm'
import BarcodeScanner from '../components/BarcodeScanner'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate, daysUntilExpiry } from '../utils/dateHelpers'
import { CATEGORIES, CATEGORY_BADGE, STOCK_STATUS, ADJUSTMENT_TYPES } from '../utils/constants'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  stockAdjust,
  getByBarcode,
} from '../api/inventory'

const emptyProduct = {
  name: '',
  category: 'TABLET',
  manufacturer: '',
  barcode: '',
  batchNo: '',
  expiryDate: '',
  stock: 0,
  reorderLevel: 10,
  sellingPrice: 0,
  mrp: 0,
  purchasePrice: 0,
  gst: 18,
  vendor: '',
  location: '',
  schedule: '',
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stockStatus: '',
    page: 1,
    limit: 20,
    total: 0,
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [stockProduct, setStockProduct] = useState(null)
  const [formData, setFormData] = useState(emptyProduct)
  const [stockData, setStockData] = useState({ type: 'ADD', qty: 0, reason: '' })
  const [saving, setSaving] = useState(false)
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false)

  const totalPages = Math.ceil(filters.total / filters.limit)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getProducts({
        search: filters.search,
        category: filters.category,
        stockStatus: filters.stockStatus,
        page: filters.page,
        limit: filters.limit,
      })
      const data = res.products || res.data || res || []
      const total = res.total || res.count || data.length || 0
      setProducts(Array.isArray(data) ? data : [])
      setFilters((prev) => ({ ...prev, total }))
    } catch (err) {
      toast.error(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [filters.search, filters.category, filters.stockStatus, filters.page, filters.limit])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
  }

  const handleCategoryChange = (e) => {
    setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))
  }

  const handleStockStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, stockStatus: e.target.value, page: 1 }))
  }

  const handleBarcodeScan = async (code) => {
    try {
      const res = await getByBarcode(code)
      if (res) {
        toast.success('Product found via barcode')
        setFormData({
          name: res.name || '',
          category: res.category || 'TABLET',
          manufacturer: res.manufacturer || '',
          barcode: code,
          batchNo: res.batchNo || '',
          expiryDate: res.expiryDate ? res.expiryDate.split('T')[0] : '',
          stock: res.stock || 0,
          reorderLevel: res.reorderLevel || 10,
          sellingPrice: res.sellingPrice || 0,
          mrp: res.mrp || 0,
          purchasePrice: res.purchasePrice || 0,
          gst: res.gst || 18,
          vendor: res.vendor || '',
          location: res.location || '',
          schedule: res.schedule || '',
        })
        setShowAddModal(true)
      }
    } catch {
      setFormData((prev) => ({ ...prev, barcode: code }))
      setShowAddModal(true)
    }
  }

  const handleAdd = async () => {
    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer || null,
        barcode: formData.barcode || null,
        batchNo: formData.batchNo || null,
        expiryDate: formData.expiryDate || null,
        currentStock: Number(formData.stock),
        reorderLevel: Number(formData.reorderLevel),
        sellingPrice: Number(formData.sellingPrice),
        mrp: Number(formData.mrp),
        purchasePrice: Number(formData.purchasePrice),
        gstPercent: Number(formData.gst),
        vendorId: formData.vendorId || null,
        unit: formData.unit || 'strip',
      }
      await createProduct(payload)
      toast.success('Product added successfully')
      setShowAddModal(false)
      setFormData(emptyProduct)
      fetchProducts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingProduct) return
    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer || null,
        barcode: formData.barcode || null,
        batchNo: formData.batchNo || null,
        expiryDate: formData.expiryDate || null,
        currentStock: Number(formData.stock),
        reorderLevel: Number(formData.reorderLevel),
        sellingPrice: Number(formData.sellingPrice),
        mrp: Number(formData.mrp),
        purchasePrice: Number(formData.purchasePrice),
        gstPercent: Number(formData.gst),
        vendorId: formData.vendorId || null,
        unit: formData.unit || 'strip',
      }
      await updateProduct(editingProduct.id, payload)
      toast.success('Product updated')
      setShowEditModal(false)
      setEditingProduct(null)
      setFormData(emptyProduct)
      fetchProducts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return
    try {
      await deleteProduct(product.id)
      toast.success('Product deleted')
      fetchProducts()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleStockAdjust = async () => {
    if (!stockProduct) return
    setSaving(true)
    try {
      await stockAdjust({
        productId: stockProduct.id,
        type: stockData.type,
        quantity: Number(stockData.qty),
        note: stockData.reason,
      })
      toast.success('Stock adjusted')
      setShowStockModal(false)
      setStockProduct(null)
      setStockData({ type: 'ADD', qty: 0, reason: '' })
      fetchProducts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      category: product.category || 'TABLET',
      manufacturer: product.manufacturer || '',
      barcode: product.barcode || '',
      batchNo: product.batchNo || '',
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      stock: product.currentStock || 0,
      reorderLevel: product.reorderLevel || 10,
      sellingPrice: product.sellingPrice || 0,
      mrp: product.mrp || 0,
      purchasePrice: product.purchasePrice || 0,
      gst: product.gstPercent || 12,
      vendor: product.vendor?.name || '',
      vendorId: product.vendorId || '',
      unit: product.unit || 'strip',
      location: '',
      schedule: '',
    })
    setShowEditModal(true)
  }

  const openStockAdjust = (product) => {
    setStockProduct(product)
    setStockData({ type: 'ADD', qty: 0, reason: '' })
    setShowStockModal(true)
  }

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (v, row) => (
        <div>
          <p className="text-gray-200 font-medium">{v || row.productName}</p>
          <p className="text-xs text-gray-500">{row.manufacturer || '-'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (v) => <span className={CATEGORY_BADGE[v] || 'badge-gray'}>{v}</span>,
    },
    {
      key: 'barcode',
      label: 'Barcode',
      render: (v) => (
        <span className="text-xs text-gray-400 font-mono">{v || '-'}</span>
      ),
    },
    {
      key: 'batchNo',
      label: 'Batch / Expiry',
      render: (v, row) => (
        <div>
          <p className="text-xs text-gray-300">{v || '-'}</p>
          <p className={`text-xs ${daysUntilExpiry(row.expiryDate)?.status === 'expired' ? 'text-red-400' : 'text-gray-500'}`}>
            {formatDate(row.expiryDate)}
          </p>
        </div>
      ),
    },
    {
      key: 'currentStock',
      label: 'Stock',
      render: (v, row) => (
        <span className={`font-medium ${v <= 0 ? 'text-red-400' : v <= (row.reorderLevel || 10) ? 'text-orange-400' : 'text-gray-200'}`}>
          {v ?? 0}
        </span>
      ),
    },
    {
      key: 'sellingPrice',
      label: 'Selling Price',
      render: (v) => (
        <span className="text-gray-200">{formatCurrency(v || 0)}</span>
      ),
    },
    {
      key: 'mrp',
      label: 'MRP',
      render: (v) => (
        <span className="text-gray-400 text-xs">{formatCurrency(v || 0)}</span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (v, row) => (
        <span className="text-xs text-gray-400">
          {v?.name || v || '-'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (v, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row) }}
            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400"
            title="Edit"
          >
            <IconEdit size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openStockAdjust(row) }}
            className="p-1.5 rounded-lg hover:bg-orange-500/10 text-orange-400"
            title="Adjust Stock"
          >
            <IconAdjustments size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
            title="Delete"
          >
            <IconTrash size={16} />
          </button>
        </div>
      ),
    },
  ]

  const renderForm = (isEdit = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Product Name *</label>
          <input
            className="input-glass"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="Paracetamol 500mg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <select
            className="input-glass"
            value={formData.category}
            onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Manufacturer</label>
          <input
            className="input-glass"
            value={formData.manufacturer}
            onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))}
            placeholder="Hetero Drugs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Barcode</label>
          <input
            className="input-glass"
            value={formData.barcode}
            onChange={(e) => setFormData((p) => ({ ...p, barcode: e.target.value }))}
            placeholder="8901234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Batch No</label>
          <input
            className="input-glass"
            value={formData.batchNo}
            onChange={(e) => setFormData((p) => ({ ...p, batchNo: e.target.value }))}
            placeholder="BT-2024-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
          <input
            type="date"
            className="input-glass"
            value={formData.expiryDate}
            onChange={(e) => setFormData((p) => ({ ...p, expiryDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Stock *</label>
          <input
            type="number"
            min="0"
            className="input-glass"
            value={formData.stock}
            onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Reorder Level</label>
          <input
            type="number"
            min="0"
            className="input-glass"
            value={formData.reorderLevel}
            onChange={(e) => setFormData((p) => ({ ...p, reorderLevel: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Purchase Price (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input-glass"
            value={formData.purchasePrice}
            onChange={(e) => setFormData((p) => ({ ...p, purchasePrice: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Selling Price (₹) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input-glass"
            value={formData.sellingPrice}
            onChange={(e) => setFormData((p) => ({ ...p, sellingPrice: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">MRP (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input-glass"
            value={formData.mrp}
            onChange={(e) => setFormData((p) => ({ ...p, mrp: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">GST (%)</label>
          <select
            className="input-glass"
            value={formData.gst}
            onChange={(e) => setFormData((p) => ({ ...p, gst: Number(e.target.value) }))}
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18%</option>
            <option value={28}>28%</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Vendor</label>
          <input
            className="input-glass"
            value={formData.vendor}
            onChange={(e) => setFormData((p) => ({ ...p, vendor: e.target.value }))}
            placeholder="Vendor name or ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Location / Rack</label>
          <input
            className="input-glass"
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            placeholder="A-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Drug Schedule</label>
          <input
            className="input-glass"
            value={formData.schedule}
            onChange={(e) => setFormData((p) => ({ ...p, schedule: e.target.value }))}
            placeholder="H, H1, G, etc."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setShowAddModal(false)
            setShowEditModal(false)
            setEditingProduct(null)
            setFormData(emptyProduct)
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={isEdit ? handleEdit : handleAdd}
          disabled={saving || !formData.name}
          className="btn-primary"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your products and stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarcodeScanner onScan={handleBarcodeScan} mode="usb" />
          <button
            onClick={() => {
              setFormData(emptyProduct)
              setShowAddModal(true)
            }}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <IconPlus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, barcode, manufacturer..."
            value={filters.search}
            onChange={handleSearchChange}
            className="input-glass pl-10"
          />
        </div>
        <select value={filters.category} onChange={handleCategoryChange} className="input-glass w-full sm:w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={filters.stockStatus} onChange={handleStockStatusChange} className="input-glass w-full sm:w-40">
          {STOCK_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage="No products found. Add your first product!"
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Showing {(filters.page - 1) * filters.limit + 1} to{' '}
            {Math.min(filters.page * filters.limit, filters.total)} of {filters.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              disabled={filters.page <= 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400"
            >
              <IconChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-300">{filters.page} / {totalPages}</span>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              disabled={filters.page >= totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <ModalForm
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormData(emptyProduct) }}
        title="Add New Product"
        size="2xl"
      >
        {renderForm(false)}
      </ModalForm>

      <ModalForm
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingProduct(null); setFormData(emptyProduct) }}
        title="Edit Product"
        size="2xl"
      >
        {renderForm(true)}
      </ModalForm>

      <ModalForm
        isOpen={showStockModal}
        onClose={() => { setShowStockModal(false); setStockProduct(null) }}
        title={`Adjust Stock - ${stockProduct?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Current Stock</label>
            <p className="text-lg font-bold text-gray-200">{stockProduct?.stock || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Adjustment Type</label>
            <select
              className="input-glass"
              value={stockData.type}
              onChange={(e) => setStockData((p) => ({ ...p, type: e.target.value }))}
            >
              {ADJUSTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
            <input
              type="number"
              min="0"
              className="input-glass"
              value={stockData.qty}
              onChange={(e) => setStockData((p) => ({ ...p, qty: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Reason (optional)</label>
            <input
              className="input-glass"
              value={stockData.reason}
              onChange={(e) => setStockData((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Damaged, expired, correction..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowStockModal(false); setStockProduct(null) }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleStockAdjust}
              disabled={saving || !stockData.qty || Number(stockData.qty) <= 0}
              className="btn-primary"
            >
              {saving ? 'Adjusting...' : 'Adjust Stock'}
            </button>
          </div>
        </div>
      </ModalForm>
    </div>
  )
}
