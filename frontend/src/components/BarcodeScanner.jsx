import React, { useRef, useEffect, useState } from 'react'
import { IconBarcode, IconCamera, IconX, IconPhoto } from '@tabler/icons-react'

export default function BarcodeScanner({ onScan, mode = 'both' }) {
  const inputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [value, setValue] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const startCamera = async () => {
    setError('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      setStream(s)
      setShowCamera(true)
      setCapturedImage(null)
      setBarcodeInput('')
    } catch {
      setError('Camera not available. Try using the gallery or manual entry.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
    setShowCamera(false)
    setCapturedImage(null)
    setBarcodeInput('')
    setError('')
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.8))
    }
  }

  const confirmScan = () => {
    const trimmed = barcodeInput.trim()
    if (trimmed) {
      onScan(trimmed)
      stopCamera()
    }
  }

  const handleFileCapture = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setCapturedImage(ev.target.result)
        setShowCamera(true)
        setBarcodeInput('')
        if (stream) {
          stream.getTracks().forEach(t => t.stop())
          setStream(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

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

  const handleScanClick = () => {
    if (navigator.mediaDevices?.getUserMedia) {
      startCamera()
    } else {
      fileInputRef.current?.click()
    }
  }

  return (
    <>
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
            onClick={handleScanClick}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10"
            title="Camera Scan"
          >
            <IconCamera size={20} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileCapture}
        />
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4">
          <div className="bg-gray-900 rounded-2xl overflow-hidden max-w-lg w-full mx-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm sm:text-base">
                {capturedImage ? 'Enter Barcode Number' : 'Scan Barcode'}
              </h3>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="p-3 sm:p-4">
              {!capturedImage ? (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-xl m-6 sm:m-8 pointer-events-none" />
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-4">
                    <button
                      onClick={capture}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all active:scale-[0.98]"
                    >
                      Capture
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 hover:bg-white/20 text-gray-100 font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 active:scale-[0.98]"
                    >
                      <IconPhoto size={18} />
                      <span className="hidden sm:inline">Gallery</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl overflow-hidden bg-black">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full object-cover max-h-56 sm:max-h-64"
                    />
                  </div>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter barcode number..."
                    className="input-glass mt-3 sm:mt-4"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        confirmScan()
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-3 sm:mt-4">
                    <button
                      onClick={confirmScan}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      disabled={!barcodeInput.trim()}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setCapturedImage(null)
                        setBarcodeInput('')
                      }}
                      className="bg-white/10 hover:bg-white/20 text-gray-100 font-medium py-2.5 px-6 rounded-xl transition-all active:scale-[0.98]"
                    >
                      Retake
                    </button>
                  </div>
                </>
              )}
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
