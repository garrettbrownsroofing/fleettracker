'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson, apiGet } from '@/lib/storage'
import ErrorBoundary from '@/components/ErrorBoundary'
import type { Assignment, MaintenanceRecord, OdometerLog, Vehicle, WeeklyCheck } from '@/types/fleet'
import { computeServiceStatuses, type ServiceStatus } from '@/lib/service'

// Reports page with vehicle overview and maintenance status

type VehicleStatus = {
  vehicle: Vehicle
  overallStatus: 'good' | 'warning' | 'overdue'
  serviceStatuses: ServiceStatus[]
  currentOdometer: number | null
  assignedDrivers: Assignment[]
}

function ReportsPageContent() {
  const { role, user, isAuthenticated } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [odologs, setOdoLogs] = useState<OdometerLog[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [weeklyChecks, setWeeklyChecks] = useState<WeeklyCheck[]>([])
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set())
  const [expandedWeeklyChecks, setExpandedWeeklyChecks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Wait for session to be hydrated before redirecting
  useEffect(() => {
    console.log('Reports page - Authentication state:', { isAuthenticated, role, user })
    if (isAuthenticated === false) {
      console.log('User not authenticated, redirecting to login')
      router.replace('/login')
    }
  }, [isAuthenticated, role, user, router])

  // Load data from API on component mount - only when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      async function loadData() {
        try {
          setLoading(true)
          const [vehiclesData, maintenanceData, odologsData, assignmentsData, weeklyChecksData] = await Promise.all([
            apiGet<Vehicle[]>('/api/vehicles'),
            apiGet<MaintenanceRecord[]>('/api/maintenance'),
            apiGet<OdometerLog[]>('/api/odometer-logs'),
            apiGet<Assignment[]>('/api/assignments'),
            apiGet<WeeklyCheck[]>('/api/weekly-checks')
          ])
          setVehicles(vehiclesData)
          setMaintenance(maintenanceData)
          setOdoLogs(odologsData)
          setAssignments(assignmentsData)
          setWeeklyChecks(weeklyChecksData)
        } catch (error) {
          console.error('Failed to load data:', error)
          // Fallback to localStorage if API fails
          setVehicles(readJson<Vehicle[]>('bft:vehicles', []))
          setMaintenance(readJson<MaintenanceRecord[]>('bft:maintenance', []))
          setOdoLogs(readJson<OdometerLog[]>('bft:odologs', []))
          setAssignments(readJson<Assignment[]>('bft:assignments', []))
          setWeeklyChecks(readJson<WeeklyCheck[]>('bft:weekly_checks', []))
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [isAuthenticated])

  if (isAuthenticated === false) {
    return null
  }

  const vehicleStatuses = useMemo((): VehicleStatus[] => {
    // Filter vehicles based on user role
    const visibleVehicles = role === 'admin' 
      ? vehicles 
      : vehicles.filter(vehicle => 
          assignments.some(assignment => 
            assignment.vehicleId === vehicle.id && assignment.driverId === user?.id
          )
        )

    return visibleVehicles.map(vehicle => {
      const serviceStatuses = computeServiceStatuses(vehicle.id, odologs, maintenance, vehicles, 250)
      const currentOdometer = serviceStatuses.length > 0 ? 
        (odologs.find(l => l.vehicleId === vehicle.id)?.odometer ?? 
         maintenance.find(m => m.vehicleId === vehicle.id && m.odometer)?.odometer ?? 
         vehicle.initialOdometer ?? null) : null
      
      const assignedDrivers = assignments.filter(a => a.vehicleId === vehicle.id)
      
      // Determine overall status based on service statuses
      const hasOverdue = serviceStatuses.some(s => s.status === 'overdue')
      const hasWarning = serviceStatuses.some(s => s.status === 'warning')
      const overallStatus = hasOverdue ? 'overdue' : hasWarning ? 'warning' : 'good'

      return {
        vehicle,
        overallStatus,
        serviceStatuses,
        currentOdometer,
        assignedDrivers
      }
    })
  }, [vehicles, odologs, maintenance, assignments, role, user])

  // Aggregate service-level counts across visible vehicles
  const serviceCounts = useMemo(() => {
    let good = 0
    let warning = 0
    let overdue = 0
    for (const vs of vehicleStatuses) {
      for (const s of vs.serviceStatuses) {
        if (s.status === 'ok') good++
        else if (s.status === 'warning') warning++
        else if (s.status === 'overdue') overdue++
      }
    }
    return { good, warning, overdue }
  }, [vehicleStatuses])

  const toggleVehicleExpansion = (vehicleId: string) => {
    setExpandedVehicles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  const toggleWeeklyChecksExpansion = (vehicleId: string) => {
    setExpandedWeeklyChecks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  const getStatusIcon = (status: 'good' | 'warning' | 'overdue') => {
    switch (status) {
      case 'good':
        return <span className="text-green-500 text-xl">✅</span>
      case 'warning':
        return <span className="text-yellow-500 text-xl">⚠️</span>
      case 'overdue':
        return <span className="text-red-500 text-xl">❌</span>
    }
  }

  const getStatusColor = (status: 'good' | 'warning' | 'overdue') => {
    switch (status) {
      case 'good':
        return 'border-green-300 bg-green-50'
      case 'warning':
        return 'border-yellow-300 bg-yellow-50'
      case 'overdue':
        return 'border-red-300 bg-red-50'
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
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading...</h3>
              <p className="text-gray-400">Checking authentication</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading reports...</h3>
              <p className="text-gray-400">Syncing data from server</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            {role === 'admin' ? 'Fleet Reports' : 'My Vehicle Status'}
          </h1>
          <p className="text-gray-400 text-lg">
            {role === 'admin' 
              ? 'Overview of all vehicles with maintenance status and detailed information.'
              : 'View maintenance status and details for your assigned vehicles.'
            }
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-2xl">🛻</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{vehicleStatuses.length}</div>
                <div className="text-sm text-gray-400">
                  {role === 'admin' ? 'Total Vehicles' : 'My Vehicles'}
                </div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{serviceCounts.good}</div>
                <div className="text-sm text-gray-400">Good Services</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{serviceCounts.warning}</div>
                <div className="text-sm text-gray-400">Warning Services</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{serviceCounts.overdue}</div>
                <div className="text-sm text-gray-400">Overdue Services</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Overview */}
        <section className="modern-card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {role === 'admin' ? 'Vehicle Status Overview' : 'My Vehicle Status'}
            </h2>
          </div>
          
          <div className="space-y-4">
            {vehicleStatuses.map((vehicleStatus, index) => (
              <div 
                key={vehicleStatus.vehicle.id} 
                className={`modern-card hover:scale-[1.02] transition-all duration-300 cursor-pointer ${getStatusColor(vehicleStatus.overallStatus)}`}
                style={{ animationDelay: `${(index + 6) * 0.1}s` }}
                onClick={() => toggleVehicleExpansion(vehicleStatus.vehicle.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-xl">🛻</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{vehicleStatus.vehicle.label}</h3>
                        {getStatusIcon(vehicleStatus.overallStatus)}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {[vehicleStatus.vehicle.plate, vehicleStatus.vehicle.vin, 
                          [vehicleStatus.vehicle.make, vehicleStatus.vehicle.model, vehicleStatus.vehicle.year].filter(Boolean).join(' ')]
                          .filter(Boolean).join(' · ')}
                      </div>
                      {vehicleStatus.currentOdometer && (
                        <div className="text-sm text-gray-500">
                          Current Odometer: {vehicleStatus.currentOdometer.toLocaleString()} miles
                        </div>
                      )}
                      {vehicleStatus.assignedDrivers.length > 0 && (
                        <div className="text-sm text-gray-500">
                          Assigned: {vehicleStatus.assignedDrivers.map(a => a.driverId).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {expandedVehicles.has(vehicleStatus.vehicle.id) ? 'Collapse' : 'Expand'}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        expandedVehicles.has(vehicleStatus.vehicle.id) ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVehicles.has(vehicleStatus.vehicle.id) && (
                  <div className="mt-6 pt-6 border-t border-gray-600 animate-fade-in">
                    <h4 className="text-lg font-semibold text-white mb-4">Maintenance Status Details</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vehicleStatus.serviceStatuses.map(service => (
                        <div 
                          key={service.service} 
                          className={`p-4 rounded-lg border ${
                            service.status === 'overdue' ? 'border-red-300 bg-red-50' : 
                            service.status === 'warning' ? 'border-yellow-300 bg-yellow-50' : 
                            'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{service.service}</span>
                            {service.status === 'overdue' && <span className="text-red-500">❌</span>}
                            {service.status === 'warning' && <span className="text-yellow-500">⚠️</span>}
                            {service.status === 'ok' && <span className="text-green-500">✅</span>}
                          </div>
                          <div className="text-sm text-gray-700 mb-1">
                            Miles since: {service.milesSince.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-700 mb-1">
                            Miles until due: {service.milesUntilDue.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600 capitalize">
                            Status: {service.status}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {vehicleStatus.vehicle.notes && (
                      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-300 mb-2">Notes</h5>
                        <p className="text-sm text-gray-400">{vehicleStatus.vehicle.notes}</p>
                      </div>
                    )}

                    {/* Weekly Checks Section */}
                    <div className="mt-6 pt-6 border-t border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Weekly Check-ins</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleWeeklyChecksExpansion(vehicleStatus.vehicle.id)
                          }}
                          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          <span>
                            {expandedWeeklyChecks.has(vehicleStatus.vehicle.id) ? 'Hide' : 'Show'} All
                          </span>
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedWeeklyChecks.has(vehicleStatus.vehicle.id) ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {(() => {
                        const vehicleWeeklyChecks = weeklyChecks
                          .filter(check => check.vehicleId === vehicleStatus.vehicle.id)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        
                        const recentChecks = vehicleWeeklyChecks.slice(0, 1)
                        const allChecks = expandedWeeklyChecks.has(vehicleStatus.vehicle.id) 
                          ? vehicleWeeklyChecks 
                          : recentChecks

                        if (vehicleWeeklyChecks.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
                                <span className="text-xl">📋</span>
                              </div>
                              <p className="text-gray-400 text-sm">No weekly check-ins recorded</p>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-4">
                            {allChecks.map((check, index) => (
                              <div key={check.id} className="bg-gray-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                                      <span className="text-sm">📋</span>
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-medium text-white">
                                        Check-in {index === 0 && !expandedWeeklyChecks.has(vehicleStatus.vehicle.id) ? '(Most Recent)' : ''}
                                      </h5>
                                      <p className="text-xs text-gray-400">
                                        {new Date(check.date).toLocaleDateString()} • Odometer: {check.odometer.toLocaleString()} miles
                                      </p>
                                    </div>
                                  </div>
                                  {index === 0 && !expandedWeeklyChecks.has(vehicleStatus.vehicle.id) && vehicleWeeklyChecks.length > 1 && (
                                    <span className="text-xs text-gray-500">
                                      +{vehicleWeeklyChecks.length - 1} more
                                    </span>
                                  )}
                                </div>

                                {/* Photos Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                  {/* Odometer Photo */}
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-400">Odometer</p>
                                    <img 
                                      src={check.odometerPhoto} 
                                      alt="Odometer reading"
                                      className="w-full h-20 object-cover rounded border border-gray-600"
                                    />
                                  </div>
                                  
                                  {/* Exterior Photos */}
                                  {check.exteriorImages.slice(0, 2).map((image, imgIndex) => (
                                    <div key={`exterior-${imgIndex}`} className="space-y-1">
                                      <p className="text-xs text-gray-400">Exterior {imgIndex + 1}</p>
                                      <img 
                                        src={image} 
                                        alt={`Exterior view ${imgIndex + 1}`}
                                        className="w-full h-20 object-cover rounded border border-gray-600"
                                      />
                                    </div>
                                  ))}
                                  
                                  {/* Interior Photos */}
                                  {check.interiorImages.slice(0, 1).map((image, imgIndex) => (
                                    <div key={`interior-${imgIndex}`} className="space-y-1">
                                      <p className="text-xs text-gray-400">Interior {imgIndex + 1}</p>
                                      <img 
                                        src={image} 
                                        alt={`Interior view ${imgIndex + 1}`}
                                        className="w-full h-20 object-cover rounded border border-gray-600"
                                      />
                                    </div>
                                  ))}
                                </div>

                                {/* Additional Photos (if any) */}
                                {(check.exteriorImages.length > 2 || check.interiorImages.length > 1) && (
                                  <div className="mb-3">
                                    <p className="text-xs text-gray-400 mb-2">Additional Photos</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {check.exteriorImages.slice(2).map((image, imgIndex) => (
                                        <img 
                                          key={`exterior-extra-${imgIndex}`}
                                          src={image} 
                                          alt={`Exterior view ${imgIndex + 3}`}
                                          className="w-full h-16 object-cover rounded border border-gray-600"
                                        />
                                      ))}
                                      {check.interiorImages.slice(1).map((image, imgIndex) => (
                                        <img 
                                          key={`interior-extra-${imgIndex}`}
                                          src={image} 
                                          alt={`Interior view ${imgIndex + 2}`}
                                          className="w-full h-16 object-cover rounded border border-gray-600"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Notes */}
                                {check.notes && (
                                  <div className="mt-3 p-3 bg-gray-700 rounded border border-gray-600">
                                    <p className="text-xs text-gray-300 font-medium mb-1">Notes:</p>
                                    <p className="text-sm text-gray-300">{check.notes}</p>
                                  </div>
                                )}

                                {/* Submission Info */}
                                <div className="mt-3 pt-2 border-t border-gray-600">
                                  <p className="text-xs text-gray-500">
                                    Submitted: {new Date(check.submittedAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {vehicleStatuses.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛻</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {role === 'admin' ? 'No vehicles found' : 'No vehicles assigned'}
                </h3>
                <p className="text-gray-400">
                  {role === 'admin' 
                    ? 'Add vehicles to your fleet to see maintenance reports.'
                    : 'Contact your administrator to get assigned to vehicles.'
                  }
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsPageContent />
    </ErrorBoundary>
  )
}


