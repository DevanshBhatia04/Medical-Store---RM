import React, { useRef, useEffect, useState } from 'react'
import { IconBarcode, IconCamera } from '@tabler/icons-react'

export default function BarcodeScanner({ onScan, mode = 'both' }) {
  const inputRef = useRef(null)
  const [value, setValue] = useState('')
  const [showCamera, setShowCamera] = useState(false)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onScan(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {mode !== 'camera' && (
        <div className="relative flex-1">
          <IconBarcode
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan or enter barcode..."
            className="input-glass pl-10 pr-4"
            autoComplete="off"
          />
        </div>
      )}
      {mode !== 'usb' && (
        <button
          type="button"
          onClick={() => setShowCamera(!showCamera)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10"
          title="Camera Scan"
        >
          <IconCamera size={20} />
        </button>
      )}
      {showCamera && (
        <div className="text-xs text-gray-500 italic">
          Camera scanner not available. Please use USB scanner or manual entry.
        </div>
      )}
    </div>
  )
}
