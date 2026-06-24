export const CATEGORIES = [
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CAPSULE', label: 'Capsule' },
  { value: 'SYRUP', label: 'Syrup' },
  { value: 'INJECTION', label: 'Injection' },
  { value: 'CREAM', label: 'Cream' },
  { value: 'DROPS', label: 'Drops' },
  { value: 'INHALER', label: 'Inhaler' },
  { value: 'OTHER', label: 'Other' },
]

export const CATEGORY_BADGE = {
  TABLET: 'badge-blue',
  CAPSULE: 'badge-purple',
  SYRUP: 'badge-green',
  INJECTION: 'badge-orange',
  CREAM: 'badge-pink',
  DROPS: 'badge-teal',
  INHALER: 'badge-yellow',
  OTHER: 'badge-gray',
}

export const STOCK_STATUS = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
]

export const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'INSURANCE', label: 'Insurance' },
]

export const GST_SLABS = [
  { value: 0, label: '0%' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
]

export const ADJUSTMENT_TYPES = [
  { value: 'ADD', label: 'Stock In' },
  { value: 'REMOVE', label: 'Stock Out' },
  { value: 'DAMAGE', label: 'Damaged' },
  { value: 'RETURN', label: 'Return to Vendor' },
  { value: 'CORRECTION', label: 'Correction' },
]
