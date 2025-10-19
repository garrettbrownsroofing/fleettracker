'use client'

import { useSession } from '@/lib/session'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { user, role, isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const fleetStats = [
    { label: 'Active Vehicles', value: '12', change: '+2 this month', color: 'text-green-400' },
    { label: 'Drivers On Duty', value: '8', change: 'All scheduled', color: 'text-blue-400' },
    { label: 'Maintenance Due', value: '3', change: 'Next 7 days', color: 'text-yellow-400' },
    { label: 'Fuel Efficiency', value: '94%', change: '+5% vs last month', color: 'text-purple-400' }
  ]

  const quickActions = [
    {
      title: 'Vehicle Management',
      description: 'Track vehicles, VINs, and license plates',
      href: '/vehicles',
      icon: '🛻',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Driver Management',
      description: 'Manage drivers and vehicle assignments',
      href: '/drivers',
      icon: '👷',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Maintenance Logs',
      description: 'Track repairs, inspections, and service records',
      href: '/maintenance',
      icon: '🔧',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Financial Reports',
      description: 'View costs, receipts, and budget analysis',
      href: '/reports',
      icon: '📊',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const recentActivity = [
    { action: 'Vehicle #001', description: 'Maintenance completed', time: '2 hours ago', status: 'done' },
    { action: 'Driver John Smith', description: 'Assignment updated', time: '4 hours ago', status: 'done' },
    { action: 'Vehicle #003', description: 'Fuel efficiency report', time: '6 hours ago', status: 'done' },
    { action: 'Weekly Log', description: 'Cleanliness check pending', time: '1 day ago', status: 'pending' }
  ]

  return (
    <main className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            {getGreeting()}, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-400 text-lg">
            Keep track of your fleet operations and stay on top of everything.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {fleetStats.map((stat, index) => (
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
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
              <button className="btn-primary text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New
              </button>
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

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="modern-card animate-fade-in-up" style={{ animationDelay: `${(index + 8) * 0.1}s` }}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${activity.status === 'done' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{activity.action}</div>
                      <div className="text-gray-400 text-xs mb-1">{activity.description}</div>
                      <div className="text-gray-500 text-xs">{activity.time}</div>
                    </div>
                    <span className={`status-${activity.status} text-xs`}>
                      {activity.status === 'done' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Work Process Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Fleet Operations</h2>
          <div className="modern-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-blue-500/20"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Fleet Management Dashboard</h3>
                <p className="text-gray-300 mb-4">
                  Monitor your entire fleet in real-time with our comprehensive tracking system.
                </p>
                <button className="btn-primary">View Dashboard</button>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-blue-500 rounded-full opacity-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}


