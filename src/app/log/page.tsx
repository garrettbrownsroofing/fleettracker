'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson, writeJson, apiGet, apiPost } from '@/lib/storage'
import { computeServiceStatuses, computeLatestOdometer } from '@/lib/service'
import type { Assignment, OdometerLog, Vehicle, MaintenanceRecord } from '@/types/fleet'
import ErrorBoundary from '@/components/ErrorBoundary'

const STORAGE_LOGS = 'bft:odologs'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function WeeklyLogPageContent() {
  const { user, isAuthenticated, role } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [odometerLogs, setOdometerLogs] = useState<OdometerLog[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Wait for session to be hydrated before redirecting
  useEffect(() => {
    console.log('Log page - Authentication state:', { isAuthenticated, user })
    if (isAuthenticated === false) {
      console.log('User not authenticated, redirecting to login')
      router.replace('/login')
    }
  }, [isAuthenticated, user, router])

  // Load data from API on component mount - only when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      async function loadData() {
        try {
          setLoading(true)
          const [assignmentsData, vehiclesData, logsData, maintenanceData, driversData] = await Promise.all([
            apiGet<Assignment[]>('/api/assignments'),
            apiGet<Vehicle[]>('/api/vehicles'),
            apiGet<OdometerLog[]>('/api/odometer-logs'),
            apiGet<MaintenanceRecord[]>('/api/maintenance'),
            apiGet<any[]>('/api/drivers')
          ])
          setAssignments(assignmentsData)
          setVehicles(vehiclesData)
          setOdometerLogs(logsData)
          setMaintenance(maintenanceData)
          setDrivers(driversData)
        } catch (error) {
          console.error('Failed to load data:', error)
          // Fallback to localStorage if API fails
          setAssignments(readJson<Assignment[]>('bft:assignments', []))
          setVehicles(readJson<Vehicle[]>('bft:vehicles', []))
          setOdometerLogs(readJson<OdometerLog[]>(STORAGE_LOGS, []))
          setMaintenance(readJson<MaintenanceRecord[]>('bft:maintenance', []))
          setDrivers(readJson<any[]>('bft:drivers', []))
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

  // Get vehicles based on role
  const myVehicleIds = useMemo(() => new Set(assignments.filter(a => a.driverId === user!.id).map(a => a.vehicleId)), [assignments, user])
  const myVehicles = vehicles.filter(v => myVehicleIds.has(v.id))
  const allVehicles = vehicles // For admin view
  const displayVehicles = role === 'admin' ? allVehicles : myVehicles

  const [form, setForm] = useState<{ vehicleId: string; date: string; odometer: string }>(() => ({
    vehicleId: displayVehicles[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    odometer: '',
  }))

  // Calculate current odometer and service statuses for each vehicle
  const vehicleStatuses = useMemo(() => {
    return displayVehicles.map(vehicle => {
      const currentOdometer = computeLatestOdometer(vehicle.id, odometerLogs, maintenance, vehicles)
      const serviceStatuses = computeServiceStatuses(vehicle.id, odometerLogs, maintenance, vehicles, 250)
      const hasOverdue = serviceStatuses.some(s => s.status === 'overdue')
      const hasWarning = serviceStatuses.some(s => s.status === 'warning')
      const overallStatus = hasOverdue ? 'overdue' : hasWarning ? 'warning' : 'good'
      
      // Find current driver assignment for admin view
      const currentAssignment = assignments.find(a => 
        a.vehicleId === vehicle.id && 
        (!a.endDate || new Date(a.endDate) > new Date())
      )
      
      return {
        vehicle,
        currentOdometer,
        serviceStatuses,
        overallStatus,
        currentDriver: currentAssignment ? 
          assignments.find(a => a.id === currentAssignment.id)?.driverId : null
      }
    })
  }, [displayVehicles, odometerLogs, maintenance, vehicles, assignments])

  async function submit() {
    const vehicleId = form.vehicleId
    const date = form.date
    const odometer = Math.max(0, Number(form.odometer) || 0)
    if (!vehicleId || !date || !odometer) return
    
    // For users, ensure they can only log odometer readings for their assigned vehicles
    if (role === 'user' && !myVehicleIds.has(vehicleId)) {
      console.error('User attempted to log odometer for unassigned vehicle')
      return
    }
    
    setSubmitting(true)
    const logEntry: OdometerLog = { id: generateId(), vehicleId, driverId: user!.id, date, odometer }
    
    try {
      await apiPost<OdometerLog>('/api/odometer-logs', logEntry)
      
      // Update local state immediately
      setOdometerLogs(prev => [logEntry, ...prev])
      setForm(f => ({ ...f, odometer: '' }))

      // Compute statuses and notify if warning/overdue
      const updatedLogs = [logEntry, ...odometerLogs]
      const statuses = computeServiceStatuses(vehicleId, updatedLogs, maintenance, vehicles, 250)
      const alerting = statuses.filter(s => s.status !== 'ok')
      if (alerting.length > 0) {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'odometer-alert',
              vehicleId,
              driverId: user!.id,
              statuses: alerting,
            }),
          })
        } catch {}
      }
    } catch (error) {
      console.error('Failed to submit odometer log:', error)
      // Fallback to localStorage
      const logs = readJson<OdometerLog[]>(STORAGE_LOGS, [])
      const all = [logEntry, ...logs]
      writeJson(STORAGE_LOGS, all)
      setOdometerLogs(prev => [logEntry, ...prev])
      setForm(f => ({ ...f, odometer: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading while session is hydrating
  if (isAuthenticated === null || loading) {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading...</h3>
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
            {role === 'admin' ? 'Fleet Odometer Log' : 'Weekly Odometer Log'}
          </h1>
          <p className="text-gray-400 text-lg">
            {role === 'admin' 
              ? 'View all vehicles and their current odometer readings. Add odometer updates for any vehicle.'
              : 'Log your vehicle\'s odometer reading and track maintenance status.'
            }
          </p>
        </div>

        {/* Log Entry Form */}
        <section className="modern-card animate-fade-in-up mb-8" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {role === 'admin' ? 'Add Odometer Reading' : 'Log Odometer Reading'}
            </h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle</label>
              <select
                className="modern-input w-full"
                value={form.vehicleId}
                onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
              >
                <option value="">Select vehicle</option>
                {displayVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                className="modern-input w-full"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Odometer Reading</label>
              <input
                className="modern-input w-full"
                placeholder="Enter current mileage"
                inputMode="numeric"
                value={form.odometer}
                onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={submit} 
              disabled={submitting || !form.vehicleId || !form.odometer}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Log Reading
                </>
              )}
            </button>
          </div>
        </section>

        {/* Vehicle Status Overview */}
        <section className="modern-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <span className="text-xl">🛻</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {role === 'admin' ? 'Fleet Vehicle Status' : 'Vehicle Status Overview'}
            </h2>
          </div>
          
          <div className="space-y-4">
            {vehicleStatuses.map((vehicleStatus, index) => (
              <div 
                key={vehicleStatus.vehicle.id} 
                className="modern-card hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${(index + 3) * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-xl">🛻</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{vehicleStatus.vehicle.label}</h3>
                        {vehicleStatus.overallStatus === 'overdue' && <span className="text-red-500 text-xl">❌</span>}
                        {vehicleStatus.overallStatus === 'warning' && <span className="text-yellow-500 text-xl">⚠️</span>}
                        {vehicleStatus.overallStatus === 'good' && <span className="text-green-500 text-xl">✅</span>}
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
                      {role === 'admin' && vehicleStatus.currentDriver && (
                        <div className="text-sm text-blue-400 mt-1">
                          Assigned Driver: {drivers.find(d => d.id === vehicleStatus.currentDriver)?.name || 'Unknown'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {vehicleStatus.serviceStatuses.filter(s => s.status === 'overdue').length} Overdue
                    </div>
                    <div className="text-sm text-gray-400">
                      {vehicleStatus.serviceStatuses.filter(s => s.status === 'warning').length} Warning
                    </div>
                  </div>
                </div>
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
                    ? 'Add vehicles to the fleet to start tracking odometer readings.'
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

export default function WeeklyLogPage() {
  return (
    <ErrorBoundary>
      <WeeklyLogPageContent />
    </ErrorBoundary>
  )
}


