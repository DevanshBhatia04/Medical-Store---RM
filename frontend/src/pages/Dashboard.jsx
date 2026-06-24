import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconCurrencyRupee,
  IconReceipt,
  IconBuildingWarehouse,
  IconPills,
  IconAlertTriangle,
  IconCalendarClock,
  IconArrowRight,
} from '@tabler/icons-react'
import MetricCard from '../components/MetricCard'
import DataTable from '../components/DataTable'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/dateHelpers'
import api from '../api/axiosInstance'

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await api.get('/reports/dashboard-summary')
        setData(res.data || res)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-24 mb-3" />
              <div className="h-8 bg-white/5 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-32 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-4 bg-white/5 rounded w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <IconAlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-400">Failed to load dashboard data</p>
          <p className="text-sm text-red-400 mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const d = data || {}

  const metrics = [
    {
      title: "Today's Sales",
      value: formatCurrency(d.todaySales || 0),
      icon: IconCurrencyRupee,
      color: 'green',
    },
    {
      title: 'Bills Today',
      value: d.billsToday || 0,
      icon: IconReceipt,
      color: 'blue',
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(d.inventoryValue || 0),
      icon: IconBuildingWarehouse,
      color: 'gray',
    },
    {
      title: 'Total Products',
      value: d.totalProducts || 0,
      icon: IconPills,
      color: 'gray',
    },
    {
      title: 'Reorder Alerts',
      value: d.reorderAlerts || 0,
      icon: IconAlertTriangle,
      color: (d.reorderAlerts || 0) > 0 ? 'red' : 'gray',
    },
    {
      title: 'Expiring Soon',
      value: d.expiringSoon || 0,
      icon: IconCalendarClock,
      color: (d.expiringSoon || 0) > 0 ? 'orange' : 'gray',
    },
  ]

  const reorderItems = (d.reorderItems || []).slice(0, 5)
  const expiryItems = (d.expiryItems || []).slice(0, 5)
  const recentInvoices = (d.recentInvoices || []).slice(0, 5)
  const topSelling = (d.topSelling || []).slice(0, 5)

  const invoiceColumns = [
    { key: 'invoiceNo', label: 'Invoice' },
    { key: 'customerName', label: 'Customer', render: (v) => v || 'Walk-in' },
    { key: 'total', label: 'Total', render: (v) => formatCurrency(v) },
  ]

  const topSellingColumns = [
    { key: 'name', label: 'Product', render: (v, row) => row.productName || row.name || row.product?.name },
    { key: 'qty', label: 'Qty Sold', render: (v) => v || 0 },
    { key: 'revenue', label: 'Revenue', render: (v) => formatCurrency(v || 0) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Welcome back! Here is your pharmacy overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Reorder Alerts</h2>
            <button
              onClick={() => navigate('/oos')}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              View All <IconArrowRight size={14} />
            </button>
          </div>
          {reorderItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No reorder alerts</p>
          ) : (
            <div className="space-y-2">
              {reorderItems.map((item, i) => (
                <div
                  key={item._id || i}
                  className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10"
                >
                  <div>
                    <p className="text-sm text-gray-200">{item.name || item.productName}</p>
                    <p className="text-xs text-gray-500">
                      Stock: {item.stock || 0} / Min: {item.reorderLevel || 0}
                    </p>
                  </div>
                  <span className="text-xs text-red-400 font-medium">
                    {item.stock || 0} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Expiry Watch</h2>
            <button
              onClick={() => navigate('/expiry')}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              View All <IconArrowRight size={14} />
            </button>
          </div>
          {expiryItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No items expiring soon</p>
          ) : (
            <div className="space-y-2">
              {expiryItems.map((item, i) => (
                <div
                  key={item._id || i}
                  className="flex items-center justify-between p-2 rounded-lg bg-orange-500/5 border border-orange-500/10"
                >
                  <div>
                    <p className="text-sm text-gray-200">{item.name || item.productName}</p>
                    <p className="text-xs text-gray-500">
                      Exp: {formatDate(item.expiryDate)} | Batch: {item.batchNo || '-'}
                    </p>
                  </div>
                  <span className="text-xs text-orange-400 font-medium">
                    {item.daysRemaining || 0}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Recent Invoices</h2>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              View All <IconArrowRight size={14} />
            </button>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent invoices</p>
          ) : (
            <DataTable columns={invoiceColumns} data={recentInvoices} />
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Top Selling Items</h2>
          </div>
          {topSelling.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
          ) : (
            <DataTable columns={topSellingColumns} data={topSelling} />
          )}
        </div>
      </div>
    </div>
  )
}
