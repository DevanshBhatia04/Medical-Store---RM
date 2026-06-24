import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { IconHeartbeat, IconEye, IconEyeOff } from '@tabler/icons-react'
import { useAuthStore } from '../store/authStore'
import { login as loginApi } from '../api/auth'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await loginApi(data.email, data.password)
      login(res.user || res, res.token)
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 mb-4 shadow-lg shadow-primary-600/30">
            <IconHeartbeat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Raman Medicos</h1>
          <p className="text-gray-400 mt-1">Pharmacy Management System</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="Enter your email"
              className={`input-glass ${errors.email ? 'input-glass-error' : ''}`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter your password"
                className={`input-glass pr-10 ${errors.password ? 'input-glass-error' : ''}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showPwd ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full loading-dot" />
                  <span className="w-2 h-2 bg-white rounded-full loading-dot" />
                  <span className="w-2 h-2 bg-white rounded-full loading-dot" />
                </div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-gray-500">
          Raman Medicos &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
