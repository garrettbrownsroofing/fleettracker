'use client'

import { useSession } from '@/lib/session'
import BrownsLogo from './BrownsLogo'
import { useState } from 'react'

export default function Header() {
  const { role, user, isAuthenticated, logout } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/vehicles', label: 'Vehicles' },
    ...(role === 'admin' ? [
      { href: '/drivers', label: 'Drivers' },
      { href: '/assignments', label: 'Assignments' },
      { href: '/reports', label: 'Reports' }
    ] : []),
    { href: '/maintenance', label: 'Maintenance' },
    { href: '/log', label: 'Weekly Log' },
    { href: '/receipts', label: 'Receipts' },
    { href: '/cleanliness', label: 'Cleanliness' }
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-gray-700 bg-black/80 backdrop-blur-lg">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        {/* Logo and Brand */}
        <a href="/" className="flex items-center gap-3 group">
          <BrownsLogo size="md" className="transition-transform group-hover:scale-105" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-white">Brown's Fleet Tracker</h1>
            <p className="text-xs text-gray-400">Professional Fleet Management</p>
          </div>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
            >
              {item.label}
            </a>
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
          {isAuthenticated ? (
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
            <a href="/login" className="btn-primary text-sm">
              Login
            </a>
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
              <a
                key={item.href}
                href={item.href}
                className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}


