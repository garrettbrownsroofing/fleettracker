'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'

export default function LoginPage() {
  const { login, isAuthenticated } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = login(username, password)
    if (!res.ok) {
      setError(res.error || 'Login failed')
      return
    }
    router.push('/vehicles')
  }

  if (isAuthenticated) {
    router.replace('/vehicles')
    return null
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={onSubmit} className="p-4 rounded-lg border bg-white space-y-3">
        <input
          className="w-full px-3 py-2 rounded border"
          placeholder="Username (admin or driver name)"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="w-full px-3 py-2 rounded border"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button type="submit" className="w-full px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Log in</button>
        <div className="text-xs text-gray-600">Default password: BrownsFleet1!</div>
      </form>
    </main>
  )
}


