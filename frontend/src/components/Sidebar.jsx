import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  IconDashboard,
  IconPills,
  IconShoppingCart,
  IconReceipt,
  IconAlertTriangle,
  IconCalendarClock,
  IconTruck,
  IconReportAnalytics,
  IconSettings,
  IconHeartbeat,
  IconX,
} from '@tabler/icons-react'

const links = [
  { to: '/dashboard', icon: IconDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: IconPills, label: 'Inventory' },
  { to: '/billing', icon: IconShoppingCart, label: 'Billing' },
  { to: '/invoices', icon: IconReceipt, label: 'Invoices' },
  { to: '/oos', icon: IconAlertTriangle, label: 'OOS Alerts' },
  { to: '/expiry', icon: IconCalendarClock, label: 'Expiry' },
  { to: '/vendors', icon: IconTruck, label: 'Vendors' },
  { to: '/reports', icon: IconReportAnalytics, label: 'Reports' },
  { to: '/settings', icon: IconSettings, label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <IconHeartbeat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Raman</h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">Medicos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <IconX size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              <Icon size={20} stroke={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[10px] text-gray-500 text-center">
            Raman Medicos v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
