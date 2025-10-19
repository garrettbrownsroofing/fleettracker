'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson, writeJson, apiGet, apiPost } from '@/lib/storage'
import { computeServiceStatuses } from '@/lib/service'
import type { Assignment, OdometerLog, Vehicle } from '@/types/fleet'
import ErrorBoundary from '@/components/ErrorBoundary'

const STORAGE_LOGS = 'bft:odologs'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function WeeklyLogPageContent() {
  const { user, isAuthenticated } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

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
          const [assignmentsData, vehiclesData] = await Promise.all([
            apiGet<Assignment[]>('/api/assignments'),
            apiGet<Vehicle[]>('/api/vehicles')
          ])
          setAssignments(assignmentsData)
          setVehicles(vehiclesData)
        } catch (error) {
          console.error('Failed to load data:', error)
          // Fallback to localStorage if API fails
          setAssignments(readJson<Assignment[]>('bft:assignments', []))
          setVehicles(readJson<Vehicle[]>('bft:vehicles', []))
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

  const myVehicleIds = useMemo(() => new Set(assignments.filter(a => a.driverId === user!.id).map(a => a.vehicleId)), [assignments, user])
  const myVehicles = vehicles.filter(v => myVehicleIds.has(v.id))

  const [form, setForm] = useState<{ vehicleId: string; date: string; odometer: string }>(() => ({
    vehicleId: myVehicles[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    odometer: '',
  }))

  async function submit() {
    const vehicleId = form.vehicleId
    const date = form.date
    const odometer = Math.max(0, Number(form.odometer) || 0)
    if (!vehicleId || !date || !odometer) return
    
    const logEntry: OdometerLog = { id: generateId(), vehicleId, driverId: user!.id, date, odometer }
    
    try {
      await apiPost<OdometerLog>('/api/odometer-logs', logEntry)
      setForm(f => ({ ...f, odometer: '' }))

      // Compute statuses and notify if warning/overdue
      const maintenance = readJson<any[]>('bft:maintenance', [])
      const vehiclesAll = readJson<any[]>('bft:vehicles', [])
      const logs = readJson<OdometerLog[]>(STORAGE_LOGS, [])
      const all = [logEntry, ...logs]
      const statuses = computeServiceStatuses(vehicleId, all, maintenance, vehiclesAll, 250)
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
      setForm(f => ({ ...f, odometer: '' }))
    }
  }

  // Show loading while session is hydrating
  if (isAuthenticated === null || loading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Loading...</h3>
            <p className="text-gray-400">Syncing data from server</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Weekly Odometer Log</h1>
      <div className="p-4 rounded-lg border bg-white space-y-3">
        <select
          className="w-full px-3 py-2 rounded border"
          value={form.vehicleId}
          onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
        >
          <option value="">Select vehicle</option>
          {myVehicles.map(v => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
        <input
          className="w-full px-3 py-2 rounded border"
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded border"
          placeholder="Odometer"
          inputMode="numeric"
          value={form.odometer}
          onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
        />
        <button onClick={submit} className="w-full px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Submit</button>
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


