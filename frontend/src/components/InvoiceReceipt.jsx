import React, { useRef } from 'react'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/dateHelpers'

export default function InvoiceReceipt({ invoice }) {
  const printRef = useRef(null)

  if (!invoice) {
    return (
      <div className="text-center py-8 text-gray-400">
        No invoice data to display.
      </div>
    )
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const content = printRef.current.innerHTML
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${invoice.invoiceNo || invoice._id}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Courier New', monospace; color: #000; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border-bottom: 1px dashed #ccc; padding: 6px 4px; text-align: left; font-size: 12px; }
            th { border-bottom: 2px solid #000; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 20px; }
            .header p { margin: 2px 0; font-size: 11px; }
            .totals { margin-top: 15px; }
            .totals table { border: none; }
            .totals td { border: none; padding: 3px 4px; font-size: 12px; }
            .totals .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; border-top: 1px dashed #ccc; padding-top: 10px; }
            .info { font-size: 11px; margin-bottom: 10px; }
            .info-row { display: flex; justify-content: space-between; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }

  const items = invoice.items || []
  const subtotal = items.reduce(
    (sum, item) => sum + (item.sellingPrice || item.price || 0) * (item.qty || item.quantity || 0),
    0
  )
  const gstTotal = items.reduce(
    (sum, item) =>
      sum +
      ((item.sellingPrice || item.price || 0) *
        (item.qty || item.quantity || 0) *
        (item.gst || 0)) /
        100,
    0
  )
  const discount = invoice.discount || 0
  const grandTotal = subtotal + gstTotal - discount

  return (
    <div>
      <div className="hidden print-only">
        <div ref={printRef}>
          <div className="header">
            <h1>Raman Medicos</h1>
            <p>Your Trusted Pharmacy</p>
            <p>GST: 07ABCDE1234F1Z5 | Phone: +91-9876543210</p>
            <p>123, Main Market, New Delhi - 110001</p>
          </div>
          <hr />
          <div className="info">
            <div className="info-row">
              <span>Invoice #: {invoice.invoiceNo || invoice._id}</span>
              <span>Date: {formatDateTime(invoice.createdAt || invoice.date)}</span>
            </div>
            <div className="info-row">
              <span>Customer: {invoice.customerName || invoice.customer?.name || 'Walk-in'}</span>
              <span>Phone: {invoice.customerPhone || invoice.customer?.phone || '-'}</span>
            </div>
            <div>Payment Mode: {invoice.paymentMode || invoice.payment?.mode || 'CASH'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">GST%</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = item.qty || item.quantity || 0
                const price = item.sellingPrice || item.price || 0
                const total = price * qty
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.name || item.productName || item.product?.name}</td>
                    <td className="text-right">{qty}</td>
                    <td className="text-right">{formatCurrency(price)}</td>
                    <td className="text-right">{item.gst || 0}%</td>
                    <td className="text-right">{formatCurrency(total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="totals">
            <table>
              <tr>
                <td>Subtotal</td>
                <td className="text-right">{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td>GST Total</td>
                <td className="text-right">{formatCurrency(gstTotal)}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td>Discount</td>
                  <td className="text-right">-{formatCurrency(discount)}</td>
                </tr>
              )}
              <tr className="grand-total">
                <td>Grand Total</td>
                <td className="text-right">{formatCurrency(grandTotal)}</td>
              </tr>
            </table>
          </div>
          <div className="footer">
            <p>Thank you for your visit!</p>
            <p>Goods once sold will not be taken back.</p>
            <p>Prescription required for scheduled drugs.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Invoice No</span>
            <span className="text-gray-200 font-medium">{invoice.invoiceNo || invoice._id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Date</span>
            <span className="text-gray-200">{formatDateTime(invoice.createdAt || invoice.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Customer</span>
            <span className="text-gray-200">{invoice.customerName || invoice.customer?.name || 'Walk-in'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Payment</span>
            <span className="badge-green">{invoice.paymentMode || invoice.payment?.mode || 'CASH'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-3 py-2 text-gray-400 font-medium">#</th>
                <th className="text-left px-3 py-2 text-gray-400 font-medium">Product</th>
                <th className="text-right px-3 py-2 text-gray-400 font-medium">Qty</th>
                <th className="text-right px-3 py-2 text-gray-400 font-medium">Price</th>
                <th className="text-right px-3 py-2 text-gray-400 font-medium">GST</th>
                <th className="text-right px-3 py-2 text-gray-400 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = item.qty || item.quantity || 0
                const price = item.sellingPrice || item.price || 0
                const total = price * qty
                return (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="px-3 py-2 text-gray-300">{idx + 1}</td>
                    <td className="px-3 py-2 text-gray-200">{item.name || item.productName || item.product?.name}</td>
                    <td className="px-3 py-2 text-gray-300 text-right">{qty}</td>
                    <td className="px-3 py-2 text-gray-300 text-right">{formatCurrency(price)}</td>
                    <td className="px-3 py-2 text-gray-300 text-right">{item.gst || 0}%</td>
                    <td className="px-3 py-2 text-gray-200 text-right font-medium">{formatCurrency(total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="glass rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-gray-200">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">GST Total</span>
            <span className="text-gray-200">{formatCurrency(gstTotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Discount</span>
              <span className="text-green-400">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10">
            <span className="text-gray-200">Grand Total</span>
            <span className="text-primary-400">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <button onClick={handlePrint} className="btn-primary w-full">
          Print Receipt
        </button>
      </div>
    </div>
  )
}
