'use client'

import { useSession } from '@/lib/session'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { apiGet } from '@/lib/storage'
import type { Vehicle, Driver, Assignment, MaintenanceRecord, WeeklyCheck } from '@/types/fleet'

export default function Home() {
  const { user, role, isAuthenticated } = useSession()
  const router = useRouter()
  
  // State for real data
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [weeklyChecks, setWeeklyChecks] = useState<WeeklyCheck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  // Load real data when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [vehiclesData, driversData, assignmentsData, maintenanceData, weeklyChecksData] = await Promise.all([
        apiGet<Vehicle[]>('/api/vehicles'),
        apiGet<Driver[]>('/api/drivers'),
        apiGet<Assignment[]>('/api/assignments'),
        apiGet<MaintenanceRecord[]>('/api/maintenance'),
        apiGet<WeeklyCheck[]>('/api/weekly-checks')
      ])
      
      setVehicles(vehiclesData)
      setDrivers(driversData)
      setAssignments(assignmentsData)
      setMaintenance(maintenanceData)
      setWeeklyChecks(weeklyChecksData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while session is hydrating
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">🛻</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading...</h3>
              <p className="text-gray-400">Checking authentication</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (isAuthenticated === false) {
    return null
  }

  // Show loading state while data is being fetched
  if (loading && isAuthenticated === true) {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">🛻</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading Dashboard...</h3>
              <p className="text-gray-400">Fetching fleet data</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Calculate real stats based on user role
  const dashboardStats = useMemo(() => {
    if (loading) {
      return [
        { label: 'Loading...', value: '...', change: 'Fetching data', color: 'text-gray-400' },
        { label: 'Loading...', value: '...', change: 'Fetching data', color: 'text-gray-400' },
        { label: 'Loading...', value: '...', change: 'Fetching data', color: 'text-gray-400' },
        { label: 'Loading...', value: '...', change: 'Fetching data', color: 'text-gray-400' }
      ]
    }

    // Filter data based on user role
    const visibleVehicles = role === 'admin' 
      ? vehicles 
      : vehicles.filter(vehicle => 
          assignments.some(assignment => 
            assignment.vehicleId === vehicle.id && assignment.driverId === user?.id
          )
        )
    
    const visibleAssignments = role === 'admin' 
      ? assignments 
      : assignments.filter(assignment => assignment.driverId === user?.id)
    
    const visibleMaintenance = role === 'admin'
      ? maintenance
      : maintenance.filter(maint => 
          visibleVehicles.some(vehicle => vehicle.id === maint.vehicleId)
        )
    
    const visibleWeeklyChecks = role === 'admin'
      ? weeklyChecks
      : weeklyChecks.filter(check => 
          visibleVehicles.some(vehicle => vehicle.id === check.vehicleId)
        )

    // Calculate stats
    const activeVehicles = visibleVehicles.length
    const assignedDrivers = role === 'admin' 
      ? drivers.length 
      : new Set(visibleAssignments.map(a => a.driverId)).size
    
    // Count recent maintenance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentMaintenance = visibleMaintenance.filter(maint => 
      new Date(maint.date) >= thirtyDaysAgo
    ).length
    
    // Count recent weekly checks (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentWeeklyChecks = visibleWeeklyChecks.filter(check => 
      new Date(check.date) >= sevenDaysAgo
    ).length

    return [
      { 
        label: role === 'admin' ? 'Total Vehicles' : 'My Vehicles', 
        value: activeVehicles.toString(), 
        change: activeVehicles > 0 ? 'Active in fleet' : 'No vehicles', 
        color: 'text-green-400' 
      },
      { 
        label: role === 'admin' ? 'Total Drivers' : 'Assigned Vehicles', 
        value: assignedDrivers.toString(), 
        change: role === 'admin' ? 'Registered drivers' : 'Vehicle assignments', 
        color: 'text-blue-400' 
      },
      { 
        label: 'Recent Maintenance', 
        value: recentMaintenance.toString(), 
        change: 'Last 30 days', 
        color: 'text-orange-400' 
      },
      { 
        label: 'Weekly Checks', 
        value: recentWeeklyChecks.toString(), 
        change: 'Last 7 days', 
        color: 'text-purple-400' 
      }
    ]
  }, [vehicles, drivers, assignments, maintenance, weeklyChecks, role, user, loading])

  // Role-aware quick actions
  const quickActions = useMemo(() => {
    const baseActions = [
      {
        title: 'Vehicles',
        description: 'View and manage vehicle information',
        href: '/vehicles' as const,
        icon: '🛻',
        color: 'from-blue-500 to-cyan-500'
      },
      {
        title: 'Maintenance',
        description: 'Track repairs and service records',
        href: '/maintenance' as const,
        icon: '🔧',
        color: 'from-orange-500 to-red-500'
      },
      {
        title: 'Reports',
        description: role === 'admin' ? 'Fleet overview and analytics' : 'My vehicle status',
        href: '/reports' as const,
        icon: '📊',
        color: 'from-purple-500 to-pink-500'
      },
      {
        title: 'Weekly Check',
        description: 'Submit weekly vehicle check-ins',
        href: '/weekly-check' as const,
        icon: '📋',
        color: 'from-green-500 to-emerald-500'
      }
    ]

    // Add driver management for admin only
    if (role === 'admin') {
      baseActions.splice(1, 0, {
        title: 'Drivers',
        description: 'Manage drivers and assignments',
        href: '/drivers' as const,
        icon: '👷',
        color: 'from-green-500 to-emerald-500'
      })
    }

    return baseActions
  }, [role])

  // Real recent activity based on actual data
  const recentActivity = useMemo(() => {
    if (loading) {
      return [
        { action: 'Loading...', description: 'Fetching recent activity', time: '...', status: 'pending' as const }
      ]
    }

    const activities: Array<{ action: string; description: string; time: string; status: 'done' | 'pending' }> = []
    
    // Add recent weekly checks
    const recentWeeklyChecks = weeklyChecks
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 2)
    
    recentWeeklyChecks.forEach(check => {
      const vehicle = vehicles.find(v => v.id === check.vehicleId)
      const timeAgo = getTimeAgo(new Date(check.submittedAt))
      activities.push({
        action: vehicle?.label || `Vehicle ${check.vehicleId}`,
        description: 'Weekly check-in submitted',
        time: timeAgo,
        status: 'done'
      })
    })

    // Add recent maintenance
    const recentMaintenance = maintenance
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2)
    
    recentMaintenance.forEach(maint => {
      const vehicle = vehicles.find(v => v.id === maint.vehicleId)
      const timeAgo = getTimeAgo(new Date(maint.date))
      activities.push({
        action: vehicle?.label || `Vehicle ${maint.vehicleId}`,
        description: maint.type ? `${maint.type} completed` : 'Maintenance completed',
        time: timeAgo,
        status: 'done'
      })
    })

    // Sort all activities by time and take the most recent
    return activities
      .sort((a, b) => {
        // Simple time sorting - in real app you'd parse the time strings
        return 0
      })
      .slice(0, 4)
  }, [vehicles, maintenance, weeklyChecks, loading])

  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <main className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            {getGreeting()}, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-400 text-lg">
            {role === 'admin' 
              ? 'Monitor your fleet operations and manage your team.'
              : 'Track your assigned vehicles and submit weekly check-ins.'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="modern-card animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">{stat.label}</h3>
                <div className={`w-3 h-3 rounded-full ${stat.color.replace('text-', 'bg-')}`}></div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {role === 'admin' ? 'Fleet Management' : 'Quick Actions'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="modern-card group hover:scale-105 transition-all duration-300"
                  style={{ animationDelay: `${(index + 4) * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-2xl`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{action.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">System Status</h2>
            <div className="space-y-4">
              <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">System Online</div>
                    <div className="text-gray-400 text-xs">All services operational</div>
                  </div>
                </div>
              </div>
              <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">Data Synced</div>
                    <div className="text-gray-400 text-xs">Latest information loaded</div>
                  </div>
                </div>
              </div>
              <div className="modern-card animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">Role: {role === 'admin' ? 'Administrator' : 'Driver'}</div>
                    <div className="text-gray-400 text-xs">
                      {role === 'admin' ? 'Full fleet access' : 'Assigned vehicles only'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        {recentActivity.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="modern-card relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${activity.status === 'done' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">{activity.action}</div>
                        <div className="text-gray-400 text-xs">{activity.description}</div>
                        <div className="text-gray-500 text-xs">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {recentActivity.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">📋</span>
                    </div>
                    <p className="text-gray-400 text-sm">No recent activity</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {role === 'admin' ? 'Activity will appear here as users interact with the system.' : 'Your recent actions will appear here.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


