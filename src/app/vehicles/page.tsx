'use client'

import { useMemo, useState } from 'react'
import type { Vehicle } from '@/types/fleet'
import { readJson, writeJson } from '@/lib/storage'
import { useSession } from '@/lib/session'
import { useRouter } from 'next/navigation'
import type { Assignment } from '@/types/fleet'

const STORAGE_KEY = 'bft:vehicles'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function VehiclesPage() {
  const { role, user, isAuthenticated } = useSession()
  const router = useRouter()
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => readJson<Vehicle[]>(STORAGE_KEY, []))
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ label: '', plate: '', vin: '' })
  const assignments = readJson<Assignment[]>('bft:assignments', [])

  const visibleVehicles = useMemo(() => {
    if (role === 'admin') return vehicles
    if (!user) return []
    const assignedVehicleIds = new Set(assignments.filter(a => a.driverId === user.id).map(a => a.vehicleId))
    return vehicles.filter(v => assignedVehicleIds.has(v.id))
  }, [vehicles, role, user, assignments])

  const totalCount = useMemo(() => visibleVehicles.length, [visibleVehicles])

  function addVehicle() {
    const label = (newVehicle.label || '').trim()
    if (!label) return
    const vehicle: Vehicle = {
      id: generateId(),
      label,
      plate: (newVehicle.plate || '').trim() || undefined,
      vin: (newVehicle.vin || '').trim() || undefined,
      make: (newVehicle.make || '').trim() || undefined,
      model: (newVehicle.model || '').trim() || undefined,
      year: newVehicle.year ? Number(newVehicle.year) : undefined,
      notes: (newVehicle.notes || '').trim() || undefined,
    }
    const nextAll = [vehicle, ...vehicles]
    setVehicles(nextAll)
    writeJson(STORAGE_KEY, nextAll)
    setNewVehicle({ label: '', plate: '', vin: '' })
  }

  function removeVehicle(id: string) {
    const nextAll = vehicles.filter(v => v.id !== id)
    setVehicles(nextAll)
    writeJson(STORAGE_KEY, nextAll)
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Vehicles</h1>

      {role === 'admin' && (
      <section className="mb-6 p-4 rounded-lg border bg-white">
        <h2 className="font-medium mb-3">Add vehicle</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="px-3 py-2 rounded border"
            placeholder="Label (e.g., Truck 12)"
            value={newVehicle.label || ''}
            onChange={e => setNewVehicle(v => ({ ...v, label: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border"
            placeholder="Plate"
            value={newVehicle.plate || ''}
            onChange={e => setNewVehicle(v => ({ ...v, plate: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border"
            placeholder="VIN"
            value={newVehicle.vin || ''}
            onChange={e => setNewVehicle(v => ({ ...v, vin: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              className="px-3 py-2 rounded border"
              placeholder="Make"
              value={newVehicle.make || ''}
              onChange={e => setNewVehicle(v => ({ ...v, make: e.target.value }))}
            />
            <input
              className="px-3 py-2 rounded border"
              placeholder="Model"
              value={newVehicle.model || ''}
              onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))}
            />
            <input
              className="px-3 py-2 rounded border"
              placeholder="Year"
              inputMode="numeric"
              value={newVehicle.year?.toString() || ''}
              onChange={e => setNewVehicle(v => ({ ...v, year: Number(e.target.value) || undefined }))}
            />
          </div>
          <textarea
            className="px-3 py-2 rounded border sm:col-span-2"
            placeholder="Notes"
            value={newVehicle.notes || ''}
            onChange={e => setNewVehicle(v => ({ ...v, notes: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button onClick={addVehicle} className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Add</button>
        </div>
      </section>
      )}

      <section className="p-4 rounded-lg border bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">All vehicles</h2>
          <div className="text-sm text-gray-600">{totalCount} total</div>
        </div>
        <ul className="mt-3 divide-y">
          {visibleVehicles.map(v => (
            <li key={v.id} className="py-3 flex items-start gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{v.label}</div>
                <div className="text-sm text-gray-600 truncate">
                  {[v.plate, v.vin, [v.make, v.model, v.year].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
                </div>
                {v.notes ? <div className="text-sm text-gray-600 mt-1">{v.notes}</div> : null}
              </div>
              {role === 'admin' && (
                <div className="ml-auto">
                  <button onClick={() => removeVehicle(v.id)} className="px-3 py-1.5 rounded border hover:bg-gray-50">Remove</button>
                </div>
              )}
            </li>
          ))}
          {visibleVehicles.length === 0 && (
            <li className="py-6 text-center text-gray-500">No vehicles yet</li>
          )}
        </ul>
      </section>
    </main>
  )
}


