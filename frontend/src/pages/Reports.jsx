import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  IconReportAnalytics,
  IconChartBar,
  IconChartPie,
  IconCategory,
  IconTruck,
  IconFileText,
  IconDownload,
} from '@tabler/icons-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import ModalForm from '../components/ModalForm'
import DataTable from '../components/DataTable'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/dateHelpers'
import { exportToExcel } from '../utils/exportExcel'
import { CATEGORIES } from '../utils/constants'
import api from '../api/axiosInstance'

const TABS = [
  { key: 'sales', label: 'Sales Report', icon: IconChartBar },
  { key: 'topProducts', label: 'Top Products', icon: IconChartPie },
  { key: 'category', label: 'Category Wise', icon: IconCategory },
  { key: 'movement', label: 'Stock Movement', icon: IconTruck },
  { key: 'gst', label: 'GST Report', icon: IconFileText },
]

const CHART_COLORS = ['#0d9488', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <IconReportAnalytics className="text-primary-400" size={24} />
          Reports
        </h1>
        <p className="text-sm text-gray-400 mt-1">Analytics and business insights</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-transparent'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'sales' && <SalesReport />}
        {activeTab === 'topProducts' && <TopProducts />}
        {activeTab === 'category' && <CategoryReport />}
        {activeTab === 'movement' && <StockMovement />}
        {activeTab === 'gst' && <GSTReport />}
      </div>
    </div>
  )
}

function SalesReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      const res = await api.get('/reports/sales', { params })
      setData(res.data || res)
    } catch (err) {
      toast.error(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="glass rounded-2xl p-8"><div className="h-64 bg-white/5 rounded animate-pulse" /></div>
  }

  const summary = data?.summary || data || {}
  const chartData = data?.chartData || data?.dailySales || []
  const paymentData = data?.paymentModeData || data?.paymentMode || []

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-glass w-40" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-glass w-40" />
          <button onClick={fetchData} className="btn-primary text-sm py-2">Apply</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Sales</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(summary.totalSales || 0)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Invoices</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{summary.totalInvoices || 0}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Avg Bill Value</p>
          <p className="text-2xl font-bold text-primary-400 mt-1">{formatCurrency(summary.avgBillValue || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Daily Sales</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No sales data for the selected period</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey={chartData[0]?.date ? 'date' : 'label'} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Payment Mode</h3>
          {paymentData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No payment data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {paymentData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function TopProducts() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('qty')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await api.get('/reports/top-products', { params: { sortBy } })
        setData(res.products || res.data || res || [])
      } catch (err) {
        toast.error(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [sortBy])

  const columns = [
    { key: 'name', label: 'Product', render: (v, row) => <span className="text-gray-200">{v || row.productName || row.product?.name}</span> },
    { key: 'qty', label: 'Qty Sold', render: (v) => <span className="text-gray-300">{v || 0}</span> },
    { key: 'revenue', label: 'Revenue', render: (v) => <span className="text-gray-200 font-medium">{formatCurrency(v || 0)}</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <button onClick={() => setSortBy('qty')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sortBy === 'qty' ? 'bg-primary-600/20 text-primary-400' : 'bg-white/5 text-gray-400'}`}>Quantity</button>
          <button onClick={() => setSortBy('revenue')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sortBy === 'revenue' ? 'bg-primary-600/20 text-primary-400' : 'bg-white/5 text-gray-400'}`}>Revenue</button>
        </div>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="No product sales data" />
      </div>
    </div>
  )
}

function CategoryReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await api.get('/reports/category-wise')
        setData(res.categories || res.data || res || [])
      } catch (err) {
        toast.error(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const columns = [
    { key: 'category', label: 'Category', render: (v) => <span className="badge-blue">{v}</span> },
    { key: 'productCount', label: 'Products', render: (v) => <span className="text-gray-300">{v || 0}</span> },
    { key: 'totalStock', label: 'Total Stock', render: (v) => <span className="text-gray-300">{v || 0}</span> },
    { key: 'totalValue', label: 'Total Value', render: (v) => <span className="text-gray-200 font-medium">{formatCurrency(v || 0)}</span> },
  ]

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No category data" />
    </div>
  )
}

function StockMovement() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [productFilter, setProductFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (productFilter) params.productId = productFilter
      if (typeFilter) params.type = typeFilter
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      const res = await api.get('/reports/stock-movement', { params })
      setData(res.movements || res.data || res || [])
    } catch (err) {
      toast.error(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [productFilter, typeFilter, fromDate, toDate])

  useEffect(() => { fetchData() }, [fetchData])

  const columns = [
    { key: 'createdAt', label: 'Date', render: (v) => <span className="text-xs text-gray-400">{formatDate(v)}</span> },
    { key: 'productName', label: 'Product', render: (v, row) => <span className="text-gray-200">{v || row.product?.name || row.name}</span> },
    { key: 'type', label: 'Type', render: (v) => {
      const colors = { ADD: 'badge-green', REMOVE: 'badge-red', DAMAGE: 'badge-orange', RETURN: 'badge-purple', CORRECTION: 'badge-yellow' }
      return <span className={colors[v] || 'badge-gray'}>{v}</span>
    }},
    { key: 'quantity', label: 'Qty', render: (v) => <span className="text-gray-300">{v || 0}</span> },
    { key: 'reason', label: 'Reason', render: (v) => <span className="text-xs text-gray-400">{v || '-'}</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Product name..." value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="input-glass flex-1 min-w-[150px]" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-glass w-36">
            <option value="">All Types</option>
            <option value="ADD">Stock In</option>
            <option value="REMOVE">Stock Out</option>
            <option value="DAMAGE">Damaged</option>
            <option value="RETURN">Return</option>
            <option value="CORRECTION">Correction</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-glass w-40" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-glass w-40" />
        </div>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="No stock movements" />
      </div>
    </div>
  )
}

function GSTReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(new Date().getFullYear()))

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/reports/gst', { params: { month, year } })
      setData(res.data || res)
    } catch (err) {
      toast.error(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportGST = () => {
    if (!data) return
    const rows = data.summary || data.gstBreakdown || []
    if (rows.length === 0) {
      toast.error('No GST data to export')
      return
    }
    exportToExcel(rows, `gst-report-${month}-${year}.xlsx`, 'GST Report')
    toast.success('GST report downloaded')
  }

  const summary = data?.summary || data?.gstBreakdown || []
  const totals = data?.totals || data?.total || {}

  const columns = [
    { key: 'gstSlab', label: 'GST %', render: (v) => <span className="text-gray-200">{v}%</span> },
    { key: 'taxableValue', label: 'Taxable Value', render: (v) => <span className="text-gray-300">{formatCurrency(v || 0)}</span> },
    { key: 'cgst', label: 'CGST', render: (v) => <span className="text-gray-300">{formatCurrency(v || 0)}</span> },
    { key: 'sgst', label: 'SGST', render: (v) => <span className="text-gray-300">{formatCurrency(v || 0)}</span> },
    { key: 'totalGst', label: 'Total GST', render: (v) => <span className="text-gray-200 font-medium">{formatCurrency(v || 0)}</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input-glass w-32">
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="input-glass w-24">
              {Array.from({ length: 5 }).map((_, i) => (
                <option key={i} value={String(new Date().getFullYear() - i)}>
                  {new Date().getFullYear() - i}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleExportGST} disabled={!data || summary.length === 0} className="btn-primary flex items-center gap-2">
            <IconDownload size={18} />
            Download GST Excel
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={summary} loading={loading} emptyMessage="No GST data for the selected period" />
      </div>

      {totals && (totals.totalGst || totals.totalTaxable) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase">Total Taxable</p>
            <p className="text-xl font-bold text-gray-200 mt-1">{formatCurrency(totals.totalTaxable || totals.taxableValue || 0)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase">Total GST</p>
            <p className="text-xl font-bold text-primary-400 mt-1">{formatCurrency(totals.totalGst || 0)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase">Total Invoices</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{totals.totalInvoices || 0}</p>
          </div>
        </div>
      )}
    </div>
  )
}
