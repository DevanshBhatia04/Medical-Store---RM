import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { IconSearch, IconEye, IconChevronLeft, IconChevronRight, IconReceipt } from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import ModalForm from '../components/ModalForm'
import InvoiceReceipt from '../components/InvoiceReceipt'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime, formatDate } from '../utils/dateHelpers'
import { PAYMENT_MODES } from '../utils/constants'
import { getInvoices, getInvoice } from '../api/invoices'

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewInvoice, setViewInvoice] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const limit = 20

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit }
      if (search) params.search = search
      if (paymentFilter) params.paymentMode = paymentFilter
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      const res = await getInvoices(params)
      const data = res.invoices || res.data || res || []
      setInvoices(Array.isArray(data) ? data : [])
      setTotal(res.total || res.count || 0)
    } catch (err) {
      toast.error(err.message)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [page, search, paymentFilter, fromDate, toDate])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleViewInvoice = async (row) => {
    setViewLoading(true)
    try {
      const invoice = await getInvoice(row._id)
      setViewInvoice(invoice.invoice || invoice)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setViewLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', render: (v, row) => (
      <span className="text-primary-400 font-mono text-xs">{v || row._id?.slice(-8).toUpperCase()}</span>
    )},
    { key: 'createdAt', label: 'Date', render: (v) => <span className="text-xs text-gray-400">{formatDateTime(v)}</span> },
    { key: 'customerName', label: 'Customer', render: (v) => v || 'Walk-in' },
    { key: 'customerPhone', label: 'Phone', render: (v) => v || '-' },
    { key: 'items', label: 'Items', render: (v) => (v?.length || 0) },
    { key: 'paymentMode', label: 'Payment', render: (v) => (
      <span className="badge-green">{v || 'CASH'}</span>
    )},
    { key: 'grandTotal', label: 'Total', render: (v, row) => (
      <span className="font-medium text-gray-200">{formatCurrency(v || row.total || 0)}</span>
    )},
    { key: '_id', label: '', render: (v, row) => (
      <button
        onClick={(e) => { e.stopPropagation(); handleViewInvoice(row) }}
        className="p-1.5 rounded-lg hover:bg-primary-500/10 text-primary-400"
        title="View Invoice"
      >
        <IconEye size={16} />
      </button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Invoice History</h1>
        <p className="text-sm text-gray-400 mt-1">View and manage all invoices</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice no or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-glass pl-10"
          />
        </div>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
          className="input-glass w-40"
          title="From Date"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1) }}
          className="input-glass w-40"
          title="To Date"
        />
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
          className="input-glass w-36"
        >
          <option value="">All Payments</option>
          {PAYMENT_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          emptyMessage="No invoices found"
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400"
            >
              <IconChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-300">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <ModalForm
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={`Invoice - ${viewInvoice?.invoiceNo || ''}`}
        size="lg"
      >
        {viewLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <InvoiceReceipt invoice={viewInvoice} />
        )}
      </ModalForm>
    </div>
  )
}
