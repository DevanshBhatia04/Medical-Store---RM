import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { IconDownload, IconCheck, IconAlertTriangle, IconRefresh } from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import { formatCurrency } from '../utils/formatCurrency'
import { CATEGORY_BADGE } from '../utils/constants'
import { getCurrent, exportExcel, resolveOos } from '../api/oos'

export default function OOSAlerts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastScan, setLastScan] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [resolving, setResolving] = useState(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getCurrent()
      const data = res.products || res.data || res || []
      setProducts(Array.isArray(data) ? data : [])
      setLastScan(res.lastScan || res.lastScanned || null)
    } catch (err) {
      toast.error(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportExcel()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const a = document.createElement('a')
      a.href = url
      a.download = `reorder-sheet-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Reorder sheet downloaded')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleResolve = async (id) => {
    setResolving(id)
    try {
      await resolveOos(id)
      toast.success('Alert resolved')
      fetchAlerts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setResolving(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Product', render: (v, row) => (
      <div>
        <p className="text-gray-200 font-medium">{v || row.productName}</p>
        <p className="text-xs text-gray-500">{row.manufacturer || '-'}</p>
      </div>
    )},
    { key: 'category', label: 'Category', render: (v) => (
      <span className={CATEGORY_BADGE[v] || 'badge-gray'}>{v}</span>
    )},
    { key: 'vendor', label: 'Vendor', render: (v, row) => (
      <span className="text-xs text-gray-400">{v?.name || v || row.vendorName || '-'}</span>
    )},
    { key: 'stock', label: 'Current Stock', render: (v) => (
      <span className="text-red-400 font-bold">{v || 0}</span>
    )},
    { key: 'reorderLevel', label: 'Reorder Level', render: (v) => (
      <span className="text-gray-300">{v || 0}</span>
    )},
    { key: 'suggestedQty', label: 'Suggested Qty', render: (v, row) => (
      <span className="text-gray-200">{v || row.suggestedQuantity || row.suggestedQty || Math.max((row.reorderLevel || 10) * 2 - (row.stock || 0), 0)}</span>
    )},
    { key: 'purchasePrice', label: 'Purchase Price', render: (v) => (
      <span className="text-gray-300">{formatCurrency(v || 0)}</span>
    )},
    { key: '_id', label: 'Actions', render: (v, row) => (
      <button
        onClick={(e) => { e.stopPropagation(); handleResolve(v) }}
        disabled={resolving === v}
        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
      >
        {resolving === v ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <IconCheck size={14} />
        )}
        Resolve
      </button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <IconAlertTriangle className="text-orange-400" size={24} />
            Reorder Alerts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {products.length > 0
              ? `${products.length} product(s) need reordering`
              : 'All products are well-stocked'}
            {lastScan && ` | Last scan: ${new Date(lastScan).toLocaleString('en-IN')}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAlerts} className="btn-secondary flex items-center gap-2">
            <IconRefresh size={18} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || products.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IconDownload size={18} />
            )}
            Download Reorder Sheet (.xlsx)
          </button>
        </div>
      </div>

      {products.length === 0 && !loading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <IconCheck size={48} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-300 text-lg font-medium">All Stocked Up!</p>
          <p className="text-gray-500 text-sm mt-1">No products need reordering at this time.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <DataTable
            columns={columns}
            data={products}
            loading={loading}
            emptyMessage="No reorder alerts"
          />
        </div>
      )}
    </div>
  )
}
