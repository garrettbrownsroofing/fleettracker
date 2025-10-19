'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import BrownsLogo from '@/components/BrownsLogo'

export default function LoginPage() {
  const { login, isAuthenticated } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await login(username, password)
      if (!res.ok) {
        setError(res.error || 'Login failed')
        setIsLoading(false)
        return
      }
      
      // Simulate loading for better UX
      setTimeout(() => {
        router.push('/')
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated === true) {
      router.replace('/')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated === true) {
    return null
  }

  return (
    <main className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <BrownsLogo size="xl" className="transition-transform hover:scale-105" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Brown's Fleet Tracker</h1>
          <p className="text-gray-400">Professional Fleet Management System</p>
        </div>

        {/* Login Form */}
        <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to access your fleet dashboard</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                className="modern-input w-full"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                className="modern-input w-full"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Demo Credentials:</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div><strong>Admin:</strong> admin / BrownsFleet1!</div>
              <div><strong>Driver:</strong> driver / BrownsFleet1!</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-gray-500 text-sm">
            © 2024 Brown's Fleet Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}


