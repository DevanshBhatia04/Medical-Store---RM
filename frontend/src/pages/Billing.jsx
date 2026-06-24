import React, { useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { IconTrash, IconPlus, IconSearch, IconShoppingCart, IconCamera } from '@tabler/icons-react'
import ModalForm from '../components/ModalForm'
import InvoiceReceipt from '../components/InvoiceReceipt'
import { useInventoryStore } from '../store/inventoryStore'
import { formatCurrency } from '../utils/formatCurrency'
import { PAYMENT_MODES } from '../utils/constants'
import { getProducts, getByBarcode } from '../api/inventory'
import { createInvoice } from '../api/invoices'

export default function Billing() {
  const { cart, addToCart, removeFromCart, updateCartQty, clearCart } = useInventoryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [discount, setDiscount] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState(null)
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)
  const barcodeInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const searchTimeout = useRef(null)

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      try {
        setSearching(true)
        const res = await getProducts({ search: query, limit: 10 })
        const data = res.products || res.data || res || []
        setSearchResults(Array.isArray(data) ? data : [])
        setShowDropdown(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const handleBarcodeScan = async (e) => {
    if (e.key === 'Enter') {
      const code = e.target.value.trim()
      if (!code) return
      try {
        const product = await getByBarcode(code)
        if (product) {
          addToCart(product)
          toast.success(`${product.name} added to cart`)
          e.target.value = ''
        }
      } catch {
        toast.error('Product not found')
      }
    }
  }

  const selectProduct = (product) => {
    addToCart(product)
    toast.success(`${product.name} added to cart`)
    setSearchQuery('')
    setShowDropdown(false)
    if (searchRef.current) searchRef.current.focus()
  }

  const handleCameraClick = () => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      cameraInputRef.current?.click()
    } else {
      barcodeInputRef.current?.focus()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice || 0) * item.qty, 0)
  const gstTotal = cart.reduce(
    (sum, item) => sum + ((item.sellingPrice || 0) * item.qty * (item.gstPercent || item.gst || 0)) / 100,
    0
  )
  const discountAmount = (subtotal * discount) / 100
  const grandTotal = subtotal + gstTotal - discountAmount

  const handleGenerateInvoice = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    setGenerating(true)
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.id,
          qty: item.qty,
          price: item.sellingPrice || 0,
          gstPercent: item.gstPercent || 12,
        })),
        customerName: customerName || 'Walk-in',
        customerPhone: customerPhone || '',
        paymentMode,
        discountAmount: discountAmount,
      }
      const invoice = await createInvoice(payload)
      setGeneratedInvoice(invoice.invoice || invoice)
      setShowReceipt(true)
      toast.success('Invoice generated successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to generate invoice')
    } finally {
      setGenerating(false)
    }
  }

  const handleNewBill = () => {
    clearCart()
    setCustomerName('')
    setCustomerPhone('')
    setDiscount(0)
    setPaymentMode('CASH')
    setShowReceipt(false)
    setGeneratedInvoice(null)
  }

  if (showReceipt && generatedInvoice) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="glass rounded-2xl p-6">
          <InvoiceReceipt invoice={generatedInvoice} />
          <button onClick={handleNewBill} className="btn-secondary w-full mt-3">
            New Bill
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Billing</h1>
        <p className="text-sm text-gray-400 mt-1">Create invoices and manage sales</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="glass rounded-2xl p-4 space-y-3 overflow-visible shrink-0">
            <div className="relative" ref={searchRef}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="Search products by name..."
                    className="input-glass pl-10"
                    autoComplete="off"
                  />
                </div>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  onKeyDown={handleBarcodeScan}
                  placeholder="Scan barcode..."
                  className="input-glass w-36 hidden sm:block"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200"
                  title="Scan with camera"
                >
                  <IconCamera size={20} />
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="camera-input"
                  className="hidden"
                  onChange={() => barcodeInputRef.current?.focus()}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Search by name or scan barcode. Tap <IconCamera size={12} className="inline" /> to use camera on mobile.</p>
              {showDropdown && searchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 left-0 right-0 mt-2 glass rounded-xl max-h-60 overflow-y-auto"
                >
                  {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0"
                      >
                        <div>
                          <p className="text-sm text-gray-200 font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            Stock: {product.currentStock || product.stock || 0} | ₹{product.sellingPrice || 0}
                          </p>
                        </div>
                        <IconPlus size={16} className="text-primary-400 shrink-0" />
                      </button>
                    ))}
                </div>
              )}
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 glass rounded-2xl p-4 overflow-y-auto min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <IconShoppingCart size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs">Search products above to add items</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Product</th>
                      <th className="text-center px-3 py-2 text-gray-400 font-medium w-24">Qty</th>
                      <th className="text-right px-3 py-2 text-gray-400 font-medium">Price</th>
                      <th className="text-right px-3 py-2 text-gray-400 font-medium">Total</th>
                      <th className="text-center px-3 py-2 text-gray-400 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const maxQty = item.currentStock || item.stock || 999
                      const total = (item.sellingPrice || 0) * item.qty
                      return (
                        <tr key={item.id} className="border-b border-white/5">
                          <td className="px-3 py-2">
                            <p className="text-gray-200">{item.name}</p>
                            {item.qty > maxQty && (
                              <p className="text-xs text-red-400">Exceeds stock ({maxQty})</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => item.qty > 1 && updateCartQty(item.id, item.qty - 1)}
                                className="w-6 h-6 rounded bg-white/10 text-gray-300 hover:bg-white/20 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-gray-200 text-sm">{item.qty}</span>
                              <button
                                onClick={() => item.qty < maxQty && updateCartQty(item.id, item.qty + 1)}
                                className="w-6 h-6 rounded bg-white/10 text-gray-300 hover:bg-white/20 flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-300">
                            {formatCurrency(item.sellingPrice || 0)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-200 font-medium">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-400"
                            >
                              <IconTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4">
          <div className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-200">Customer Details</h2>
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-glass"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-glass"
            />
          </div>

          <div className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-200">Payment</h2>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="input-glass"
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="input-glass"
              />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Items</span>
              <span className="text-gray-200">{cart.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-gray-200">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">GST</span>
              <span className="text-gray-200">{formatCurrency(gstTotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Discount</span>
                <span className="text-green-400">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
              <span className="text-gray-200">Total</span>
              <span className="text-primary-400">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={handleGenerateInvoice}
            disabled={generating || cart.length === 0}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconShoppingCart size={20} />
                Generate Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
