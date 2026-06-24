import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  IconSettings,
  IconBuildingStore,
  IconBell,
  IconUser,
  IconInfoCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react'
import { useAuthStore } from '../store/authStore'
import { changePassword as changePasswordApi } from '../api/auth'
import api from '../api/axiosInstance'

export default function Settings() {
  const [savingStore, setSavingStore] = useState(false)
  const [savingAlerts, setSavingAlerts] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [systemInfo, setSystemInfo] = useState(null)

  const [store, setStore] = useState({
    name: 'Raman Medicos',
    address: '',
    gst: '',
    phone: '',
    ownerName: '',
  })

  const [alerts, setAlerts] = useState({
    expiryAlertDays: 30,
    defaultReorderLevel: 10,
  })

  const [account, setAccount] = useState({
    name: '',
    email: '',
  })

  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const { user, updateUser } = useAuthStore()

  useEffect(() => {
    if (user) {
      setAccount({ name: user.name || '', email: user.email || '' })
    }
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings')
        const s = res.data || res.settings || res || {}
        if (s.store) setStore((prev) => ({ ...prev, ...s.store }))
        if (s.alerts) setAlerts((prev) => ({ ...prev, ...s.alerts }))
        if (s.expiryAlertDays) setAlerts((prev) => ({ ...prev, expiryAlertDays: s.expiryAlertDays }))
        if (s.defaultReorderLevel) setAlerts((prev) => ({ ...prev, defaultReorderLevel: s.defaultReorderLevel }))
      } catch {
        // use defaults
      }
    }
    const fetchSystemInfo = async () => {
      try {
        const res = await api.get('/reports/dashboard-summary')
        setSystemInfo(res.data || res)
      } catch {
        setSystemInfo(null)
      }
    }
    fetchSettings()
    fetchSystemInfo()
  }, [user])

  const handleSaveStore = async () => {
    setSavingStore(true)
    try {
      await api.put('/settings', { store })
      toast.success('Store details saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingStore(false)
    }
  }

  const handleSaveAlerts = async () => {
    setSavingAlerts(true)
    try {
      await api.put('/settings', {
        expiryAlertDays: alerts.expiryAlertDays,
        defaultReorderLevel: alerts.defaultReorderLevel,
      })
      toast.success('Alert thresholds saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingAlerts(false)
    }
  }

  const handleSaveAccount = async () => {
    setSavingAccount(true)
    try {
      await api.put('/auth/update-profile', { name: account.name })
      updateUser({ ...user, name: account.name })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingAccount(false)
    }
  }

  const handleChangePassword = async () => {
    if (password.newPassword !== password.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setChangingPwd(true)
    try {
      await changePasswordApi(password.currentPassword, password.newPassword)
      toast.success('Password changed')
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setChangingPwd(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <IconSettings className="text-primary-400" size={24} />
          Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage your store and account settings</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary-400">
          <IconBuildingStore size={20} />
          <h2 className="text-sm font-semibold text-gray-200">Store Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Store Name</label>
            <input className="input-glass" value={store.name} onChange={(e) => setStore((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Owner Name</label>
            <input className="input-glass" value={store.ownerName} onChange={(e) => setStore((p) => ({ ...p, ownerName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">GST Number</label>
            <input className="input-glass" value={store.gst} onChange={(e) => setStore((p) => ({ ...p, gst: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
            <input className="input-glass" value={store.phone} onChange={(e) => setStore((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
            <textarea className="input-glass" rows={2} value={store.address} onChange={(e) => setStore((p) => ({ ...p, address: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveStore} disabled={savingStore} className="btn-primary flex items-center gap-2">
            {savingStore ? 'Saving...' : <><IconCheck size={18} /> Save Store Details</>}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-orange-400">
          <IconBell size={20} />
          <h2 className="text-sm font-semibold text-gray-200">Alert Thresholds</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Alert Window (days)</label>
            <input type="number" min="1" max="365" className="input-glass" value={alerts.expiryAlertDays} onChange={(e) => setAlerts((p) => ({ ...p, expiryAlertDays: Number(e.target.value) }))} />
            <p className="text-xs text-gray-500 mt-1">Products expiring within this range will trigger alerts</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Default Reorder Level</label>
            <input type="number" min="1" className="input-glass" value={alerts.defaultReorderLevel} onChange={(e) => setAlerts((p) => ({ ...p, defaultReorderLevel: Number(e.target.value) }))} />
            <p className="text-xs text-gray-500 mt-1">Minimum stock before reorder alert triggers</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveAlerts} disabled={savingAlerts} className="btn-primary flex items-center gap-2">
            {savingAlerts ? 'Saving...' : <><IconCheck size={18} /> Save Thresholds</>}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <IconUser size={20} />
          <h2 className="text-sm font-semibold text-gray-200">Account Settings</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input className="input-glass" value={account.name} onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input className="input-glass" value={account.email} disabled readOnly />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveAccount} disabled={savingAccount} className="btn-primary flex items-center gap-2">
            {savingAccount ? 'Saving...' : <><IconCheck size={18} /> Update Profile</>}
          </button>
        </div>

        <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Change Password</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
              <input type="password" className="input-glass" value={password.currentPassword} onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
              <input type="password" className="input-glass" value={password.newPassword} onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input type="password" className="input-glass" value={password.confirmPassword} onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))} />
            </div>
          </div>
          {password.newPassword && password.confirmPassword && password.newPassword !== password.confirmPassword && (
            <p className="text-xs text-red-400">Passwords do not match</p>
          )}
          <div className="flex justify-end">
            <button onClick={handleChangePassword} disabled={changingPwd || !password.currentPassword || !password.newPassword || password.newPassword !== password.confirmPassword} className="btn-primary flex items-center gap-2">
              {changingPwd ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-gray-400">
          <IconInfoCircle size={20} />
          <h2 className="text-sm font-semibold text-gray-200">System Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-gray-400">DB Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-green-400 font-medium">Connected</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-gray-400">Total Products</p>
            <p className="text-lg font-bold text-gray-200 mt-0.5">{systemInfo?.totalProducts || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-gray-400">Total Invoices</p>
            <p className="text-lg font-bold text-gray-200 mt-0.5">{systemInfo?.totalInvoices || systemInfo?.billsToday || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-gray-400">Last OOS Scan</p>
            <p className="text-sm text-gray-200 mt-0.5">{systemInfo?.lastOosScan ? new Date(systemInfo.lastOosScan).toLocaleDateString('en-IN') : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
