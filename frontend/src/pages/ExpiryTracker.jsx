import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { IconTrash, IconCalendarClock } from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import { formatDate, daysUntilExpiry } from '../utils/dateHelpers'
import { CATEGORY_BADGE } from '../utils/constants'
import { stockAdjust } from '../api/inventory'
import api from '../api/axiosInstance'

const TABS = [
  { key: 'expired', label: 'Expired', param: -1 },
  { key: '30', label: '30 Days', param: 30 },
  { key: '90', label: '90 Days', param: 90 },
  { key: 'all', label: 'All', param: 0 },
]

export default function ExpiryTracker() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('30')
  const [removing, setRemoving] = useState(null)

  const fetchExpiry = useCallback(async () => {
    try {
      setLoading(true)
      const tab = TABS.find((t) => t.key === activeTab)
      const daysThreshold = tab?.param
      const res = await api.get('/expiry', {
        params: daysThreshold > 0 ? { daysThreshold } : activeTab === 'expired' ? { daysThreshold: -1 } : {},
      })
      const data = res.products || res.data || res || []
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchExpiry()
  }, [fetchExpiry])

  const handleMarkRemoved = async (product) => {
    if (!window.confirm(`Mark "${product.name}" as removed (damaged/disposed)?`)) return
    setRemoving(product._id)
    try {
      await stockAdjust({
        productId: product._id,
        type: 'DAMAGE',
        quantity: product.stock || 0,
        reason: `Expired product - Batch: ${product.batchNo || 'N/A'}`,
      })
      toast.success('Product marked as removed')
      fetchExpiry()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRemoving(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Product', render: (v, row) => (
      <div>
        <p className="text-gray-200 font-medium">{v || row.productName}</p>
        <p className="text-xs text-gray-500">{row.manufacturer || '-'}</p>
      </div>
    )},
    { key: 'batchNo', label: 'Batch No', render: (v) => (
      <span className="text-xs text-gray-400 font-mono">{v || '-'}</span>
    )},
    { key: 'expiryDate', label: 'Expiry Date', render: (v) => {
      const { label, status } = daysUntilExpiry(v)
      const colorClass = status === 'expired' ? 'text-red-400' : status === 'expiring' ? 'text-orange-400' : 'text-gray-300'
      return <span className={colorClass}>{formatDate(v)}</span>
    }},
    { key: 'expiryDate', label: 'Days Remaining', render: (v) => {
      const { label, status } = daysUntilExpiry(v)
      const colorClass = status === 'expired' ? 'text-red-400 font-bold' : status === 'expiring' ? 'text-orange-400' : 'text-gray-400'
      return <span className={colorClass}>{label}</span>
    }},
    { key: 'stock', label: 'Stock', render: (v) => (
      <span className="text-gray-200">{v || 0}</span>
    )},
    { key: 'category', label: 'Category', render: (v) => (
      <span className={CATEGORY_BADGE[v] || 'badge-gray'}>{v}</span>
    )},
    { key: '_id', label: 'Action', render: (v, row) => {
      const { status } = daysUntilExpiry(row.expiryDate)
      if (status !== 'expired') return <span className="text-xs text-gray-500">-</span>
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleMarkRemoved(row) }}
          disabled={removing === v}
          className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
        >
          {removing === v ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <IconTrash size={14} />
          )}
          Mark Removed
        </button>
      )
    }},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <IconCalendarClock className="text-orange-400" size={24} />
          Expiry Tracker
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor and manage expiring and expired products
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage={
            activeTab === 'expired'
              ? 'No expired products'
              : `No products expiring within ${activeTab} days`
          }
        />
      </div>
    </div>
  )
}
