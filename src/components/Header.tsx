'use client'

import { useSession } from '@/lib/session'
import BrownsLogo from './BrownsLogo'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const { role, user, isAuthenticated, logout } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const navItems = [
    { href: '/vehicles' as const, label: 'Vehicles' },
    ...(isHydrated && role === 'admin' ? [
      { href: '/drivers' as const, label: 'Drivers' },
      { href: '/reports' as const, label: 'Reports' }
    ] : []),
    { href: '/maintenance' as const, label: 'Maintenance' },
    { href: '/log' as const, label: 'Weekly Log' },
    { href: '/receipts' as const, label: 'Receipts' },
    { href: '/cleanliness' as const, label: 'Cleanliness' }
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-gray-700 bg-black/80 backdrop-blur-lg">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <BrownsLogo size="md" className="transition-transform group-hover:scale-105" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-white">Brown's Fleet Tracker</h1>
            <p className="text-xs text-gray-400">Professional Fleet Management</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 1 1 15 0v5z" />
            </svg>
          </button>

          {/* User Menu */}
          {!isHydrated ? (
            <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
          ) : isAuthenticated === true ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
              <button
                onClick={logout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Login
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-700 bg-black/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}


