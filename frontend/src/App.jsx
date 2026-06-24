import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Billing from './pages/Billing'
import InvoiceHistory from './pages/InvoiceHistory'
import OOSAlerts from './pages/OOSAlerts'
import ExpiryTracker from './pages/ExpiryTracker'
import Vendors from './pages/Vendors'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function ProtectedRoute() {
  const token = localStorage.getItem('medstore_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/invoices" element={<InvoiceHistory />} />
              <Route path="/oos" element={<OOSAlerts />} />
              <Route path="/expiry" element={<ExpiryTracker />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
