'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson, writeJson, apiGet, apiPost } from '@/lib/storage'
import ErrorBoundary from '@/components/ErrorBoundary'
import type { Assignment, CleanlinessLog, Vehicle } from '@/types/fleet'

const STORAGE_CLEAN = 'bft:cleanliness'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function CleanlinessPageContent() {
  const { user, isAuthenticated } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Wait for session to be hydrated before redirecting
  useEffect(() => {
    console.log('Cleanliness page - Authentication state:', { isAuthenticated, user })
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

  const [form, setForm] = useState<{ vehicleId: string; date: string; exterior: File[]; interior: File[]; notes: string }>(() => ({
    vehicleId: myVehicles[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    exterior: [],
    interior: [],
    notes: '',
  }))

  async function submit() {
    if (!form.vehicleId) return
    const exterior: string[] = []
    for (const f of form.exterior) exterior.push(await fileToDataUrl(f))
    const interior: string[] = []
    for (const f of form.interior) interior.push(await fileToDataUrl(f))
    
    const rec: CleanlinessLog = {
      id: generateId(),
      vehicleId: form.vehicleId,
      driverId: user!.id,
      date: form.date,
      exteriorImages: exterior,
      interiorImages: interior,
      notes: form.notes || undefined,
    }
    
    try {
      await apiPost<CleanlinessLog>('/api/cleanliness', rec)
      setForm(f => ({ ...f, exterior: [], interior: [], notes: '' }))
    } catch (error) {
      console.error('Failed to submit cleanliness log:', error)
      // Fallback to localStorage
      const logs = readJson<CleanlinessLog[]>(STORAGE_CLEAN, [])
      writeJson(STORAGE_CLEAN, [rec, ...logs])
      setForm(f => ({ ...f, exterior: [], interior: [], notes: '' }))
    }
  }

  // Show loading while session is hydrating
  if (isAuthenticated === null || loading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">🧽</span>
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
      <h1 className="text-2xl font-semibold mb-4">Weekly Cleanliness Check</h1>
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
        <input className="w-full px-3 py-2 rounded border" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <div>
          <div className="text-sm font-medium mb-1">Exterior photos</div>
          <input className="w-full" type="file" accept="image/*" multiple onChange={e => setForm(f => ({ ...f, exterior: Array.from(e.target.files || []) }))} />
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Interior photos</div>
          <input className="w-full" type="file" accept="image/*" multiple onChange={e => setForm(f => ({ ...f, interior: Array.from(e.target.files || []) }))} />
        </div>
        <textarea className="w-full px-3 py-2 rounded border" placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button onClick={submit} className="w-full px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Submit</button>
      </div>
    </main>
  )
}

export default function CleanlinessPage() {
  return (
    <ErrorBoundary>
      <CleanlinessPageContent />
    </ErrorBoundary>
  )
}


