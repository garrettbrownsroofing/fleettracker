'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson, writeJson } from '@/lib/storage'
import { computeServiceStatuses } from '@/lib/service'
import type { Assignment, OdometerLog, Vehicle } from '@/types/fleet'

const STORAGE_LOGS = 'bft:odologs'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function WeeklyLogPage() {
  const { user, isAuthenticated } = useSession()
  const router = useRouter()
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }

  const assignments = readJson<Assignment[]>('bft:assignments', [])
  const vehicles = readJson<Vehicle[]>('bft:vehicles', [])
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
    const logs = readJson<OdometerLog[]>(STORAGE_LOGS, [])
    const next: OdometerLog = { id: generateId(), vehicleId, driverId: user!.id, date, odometer }
    const all = [next, ...logs]
    writeJson(STORAGE_LOGS, all)
    setForm(f => ({ ...f, odometer: '' }))

    // Compute statuses and notify if warning/overdue
    const maintenance = readJson<any[]>('bft:maintenance', [])
    const statuses = computeServiceStatuses(vehicleId, all, maintenance)
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


