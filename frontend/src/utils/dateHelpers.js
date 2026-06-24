export const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export const daysUntilExpiry = (date) => {
  if (!date) return { days: 0, status: 'unknown' }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(date)
  expiry.setHours(0, 0, 0, 0)
  const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Expired', status: 'expired' }
  if (diff === 0) return { label: 'Expires Today', status: 'expiring' }
  return { label: `${diff} days`, status: diff <= 30 ? 'expiring' : 'normal' }
}

export const isExpiringSoon = (date, days = 30) => {
  if (!date) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(date)
  expiry.setHours(0, 0, 0, 0)
  const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  return diff >= 0 && diff <= days
}
