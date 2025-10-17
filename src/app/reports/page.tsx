'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson } from '@/lib/storage'
import type { Assignment, MaintenanceRecord, OdometerLog, Vehicle } from '@/types/fleet'
import { computeServiceStatuses } from '@/lib/service'

export default function ReportsPage() {
  const { role, isAuthenticated } = useSession()
  const router = useRouter()
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }
  if (role !== 'admin') {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Reports</h1>
        <p className="text-gray-600">Access restricted to admin.</p>
      </main>
    )
  }

  const vehicles = readJson<Vehicle[]>('bft:vehicles', [])
  const maintenance = readJson<MaintenanceRecord[]>('bft:maintenance', [])
  const odologs = readJson<OdometerLog[]>('bft:odologs', [])
  const assignments = readJson<Assignment[]>('bft:assignments', [])

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '')

  const statuses = useMemo(() => computeServiceStatuses(selectedVehicleId, odologs, maintenance, vehicles, 250), [selectedVehicleId, odologs, maintenance, vehicles])
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null
  const assignedDrivers = assignments.filter(a => a.vehicleId === selectedVehicleId)

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <select
          className="ml-auto px-3 py-2 rounded border"
          value={selectedVehicleId}
          onChange={e => setSelectedVehicleId(e.target.value)}
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </div>

      {selectedVehicle ? (
        <section className="p-4 rounded-lg border bg-white">
          <div className="font-medium mb-1">{selectedVehicle.label}</div>
          <div className="text-sm text-gray-600">
            {[selectedVehicle.plate, selectedVehicle.vin].filter(Boolean).join(' · ')}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Assigned: {assignedDrivers.length > 0 ? assignedDrivers.map(a => a.driverId).join(', ') : 'None'}
          </div>
        </section>
      ) : null}

      <section className="p-4 rounded-lg border bg-white">
        <h2 className="font-medium mb-3">Service status</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {statuses.map(s => (
            <div key={s.service} className={`p-3 rounded border ${s.status === 'overdue' ? 'border-red-300 bg-red-50' : s.status === 'warning' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="font-medium">{s.service}</div>
              <div className="text-sm text-gray-700">Miles since: {s.milesSince}</div>
              <div className="text-sm text-gray-700">Miles until due: {s.milesUntilDue}</div>
              <div className="text-xs text-gray-600">Status: {s.status}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}


