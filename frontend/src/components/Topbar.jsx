import React, { useState, useEffect } from 'react'
import { IconMenu2, IconBell, IconLogout, IconHeartbeat } from '@tabler/icons-react'
import { useAuthStore } from '../store/authStore'
import { getCurrent } from '../api/oos'

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const [oosCount, setOosCount] = useState(0)

  useEffect(() => {
    const fetchOos = async () => {
      try {
        const data = await getCurrent()
        setOosCount(data?.products?.length || data?.length || 0)
      } catch {
        setOosCount(0)
      }
    }
    fetchOos()
    const interval = setInterval(fetchOos, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/10">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-gray-400"
          >
            <IconMenu2 size={22} />
          </button>
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <IconHeartbeat className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Raman Medicos</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {oosCount > 0 && (
            <button
              onClick={() => window.location.href = '/oos'}
              className="relative p-2 rounded-xl hover:bg-white/10 text-gray-400"
              title="OOS Alerts"
            >
              <IconAlertTriangle size={20} className="text-orange-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {oosCount > 9 ? '9+' : oosCount}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm text-gray-200 hidden sm:block">
              {user?.name || 'User'}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <IconLogout size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

function IconAlertTriangle({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 9v4" />
      <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.875h16.214a1.914 1.914 0 0 0 1.636 -2.875l-8.106 -13.534a1.914 1.914 0 0 0 -3.274 0z" />
      <path d="M12 16h.01" />
    </svg>
  )
}
