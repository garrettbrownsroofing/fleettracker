'use client'

import { useSession } from '@/lib/session'
import BrownsLogo from './BrownsLogo'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/lib/useNotifications'
import { apiGet } from '@/lib/storage'
import type { Vehicle, MaintenanceRecord, WeeklyCheck, Assignment } from '@/types/fleet'

export default function Header() {
  const { role, user, isAuthenticated, logout } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  
  // Data for notifications
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [weeklyChecks, setWeeklyChecks] = useState<WeeklyCheck[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notificationsLoaded, setNotificationsLoaded] = useState(false)
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isNotificationOpen) {
        const target = event.target as Element
        if (!target.closest('[data-notification-dropdown]')) {
          setIsNotificationOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isNotificationOpen])

  // Load data for notifications when authenticated
  useEffect(() => {
    if (isAuthenticated === true && !notificationsLoaded) {
      async function loadNotificationData() {
        try {
          const [vehiclesData, maintenanceData, weeklyChecksData, assignmentsData] = await Promise.all([
            apiGet<Vehicle[]>('/api/vehicles'),
            apiGet<MaintenanceRecord[]>('/api/maintenance'),
            apiGet<WeeklyCheck[]>('/api/weekly-checks'),
            apiGet<Assignment[]>('/api/assignments')
          ])
          setVehicles(vehiclesData)
          setMaintenance(maintenanceData)
          setWeeklyChecks(weeklyChecksData)
          setAssignments(assignmentsData)
          setNotificationsLoaded(true)
        } catch (error) {
          console.error('Failed to load notification data:', error)
        }
      }
      loadNotificationData()
    }
  }, [isAuthenticated, notificationsLoaded])

  // Get notifications
  const { notifications, notificationCount, highPriorityCount } = useNotifications(
    vehicles,
    maintenance,
    weeklyChecks,
    assignments,
    role || 'user',
    user?.id,
    dismissedNotifications
  )

  // Function to dismiss a notification
  const dismissNotification = (notificationId: string) => {
    setDismissedNotifications(prev => new Set([...prev, notificationId]))
  }

  // Function to dismiss all notifications
  const dismissAllNotifications = () => {
    const allNotificationIds = notifications.map(n => n.id)
    setDismissedNotifications(prev => new Set([...prev, ...allNotificationIds]))
  }

  const navItems = [
    { href: '/vehicles' as const, label: 'Vehicles' },
    ...(isHydrated && role === 'admin' ? [
      { href: '/drivers' as const, label: 'Drivers' }
    ] : []),
    { href: '/reports' as const, label: 'Reports' },
    { href: '/maintenance' as const, label: 'Maintenance' },
    { href: '/weekly-check' as const, label: 'Weekly Check' }
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
          {isAuthenticated === true && (
            <div className="relative" data-notification-dropdown>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 1 1 15 0v5z" />
                </svg>
                {notificationCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    highPriorityCount > 0 
                      ? 'bg-red-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 mx-2 sm:mx-0"
                     style={{ 
                       right: '0',
                       maxWidth: 'calc(100vw - 1rem)',
                       minWidth: '280px',
                       transform: 'translateX(0)',
                       left: 'auto'
                     }}>
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        <p className="text-sm text-gray-400">
                          {notificationCount === 0 ? 'No notifications' : `${notificationCount} item${notificationCount === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={dismissAllNotifications}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Dismiss All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2">
                          <span className="text-xl">✓</span>
                        </div>
                        <p>All caught up!</p>
                        <p className="text-sm">No maintenance due or overdue weekly checks</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-4 hover:bg-gray-800/50 transition-colors group">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                notification.priority === 'high' 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : notification.priority === 'medium'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {notification.type === 'maintenance' ? '🔧' : '📊'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white truncate">
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-gray-400 truncate">
                                  {notification.vehicleLabel}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  notification.priority === 'high' 
                                    ? 'bg-red-500' 
                                    : notification.priority === 'medium'
                                    ? 'bg-orange-500'
                                    : 'bg-blue-500'
                                }`} />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    dismissNotification(notification.id)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all duration-200 p-1"
                                  title="Dismiss notification"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <Link
                              href={notification.href}
                              className="block mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={() => setIsNotificationOpen(false)}
                            >
                              View Details →
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-700">
                      <Link
                        href="/reports"
                        className="block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        View all in Reports →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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


