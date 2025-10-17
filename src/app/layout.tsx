import './globals.css'
import type { Metadata } from 'next'
import { SessionProvider, useSession } from '@/lib/session'

export const metadata: Metadata = {
  title: "Brown's Fleet Tracker",
  description: 'Track vehicles, assignments, and maintenance at a glance.'
}

function Header() {
  'use client'
  const { role, user, isAuthenticated, logout } = useSession()
  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <nav className="max-w-5xl mx-auto flex items-center gap-4 p-4">
        <a href="/" className="font-semibold">Brown's Fleet Tracker</a>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <a href="/vehicles" className="px-3 py-1.5 rounded hover:bg-gray-100">Vehicles</a>
          {role === 'admin' && (
            <>
              <a href="/drivers" className="px-3 py-1.5 rounded hover:bg-gray-100">Drivers</a>
              <a href="/assignments" className="px-3 py-1.5 rounded hover:bg-gray-100">Assignments</a>
            </>
          )}
          <a href="/maintenance" className="px-3 py-1.5 rounded hover:bg-gray-100">Maintenance</a>
          {isAuthenticated ? (
            <>
              <span className="ml-2 text-gray-600">{user?.name} ({role})</span>
              <button onClick={logout} className="ml-2 px-3 py-1.5 rounded border hover:bg-gray-50">Logout</button>
            </>
          ) : (
            <a href="/login" className="ml-2 px-3 py-1.5 rounded border hover:bg-gray-50">Login</a>
          )}
        </div>
      </nav>
    </header>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}


