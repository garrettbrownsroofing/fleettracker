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
      initialOdometer: newVehicle.initialOdometer ? Number(newVehicle.initialOdometer) : undefined,
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
    <main className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">Vehicle Management</h1>
          <p className="text-gray-400 text-lg">
            Track and manage your fleet vehicles with detailed information and maintenance records.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalCount}</div>
                <div className="text-sm text-gray-400">Total Vehicles</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{visibleVehicles.length}</div>
                <div className="text-sm text-gray-400">Active Vehicles</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-sm text-gray-400">Maintenance Due</div>
              </div>
            </div>
          </div>
        </div>

        {role === 'admin' && (
          <section className="mb-8 modern-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Add New Vehicle</h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Label</label>
                <input
                  className="modern-input w-full"
                  placeholder="e.g., Truck 12, Van 5"
                  value={newVehicle.label || ''}
                  onChange={e => setNewVehicle(v => ({ ...v, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">License Plate</label>
                <input
                  className="modern-input w-full"
                  placeholder="ABC-123"
                  value={newVehicle.plate || ''}
                  onChange={e => setNewVehicle(v => ({ ...v, plate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">VIN Number</label>
                <input
                  className="modern-input w-full"
                  placeholder="1HGBH41JXMN109186"
                  value={newVehicle.vin || ''}
                  onChange={e => setNewVehicle(v => ({ ...v, vin: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Starting Odometer</label>
                <input
                  className="modern-input w-full"
                  placeholder="0"
                  inputMode="numeric"
                  value={(newVehicle.initialOdometer as any)?.toString?.() || ''}
                  onChange={e => setNewVehicle(v => ({ ...v, initialOdometer: Number(e.target.value) || undefined }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Make</label>
                  <input
                    className="modern-input w-full"
                    placeholder="Ford"
                    value={newVehicle.make || ''}
                    onChange={e => setNewVehicle(v => ({ ...v, make: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                  <input
                    className="modern-input w-full"
                    placeholder="Transit"
                    value={newVehicle.model || ''}
                    onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <input
                    className="modern-input w-full"
                    placeholder="2023"
                    inputMode="numeric"
                    value={newVehicle.year?.toString() || ''}
                    onChange={e => setNewVehicle(v => ({ ...v, year: Number(e.target.value) || undefined }))}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  className="modern-input w-full h-20 resize-none"
                  placeholder="Additional notes about this vehicle..."
                  value={newVehicle.notes || ''}
                  onChange={e => setNewVehicle(v => ({ ...v, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6">
              <button onClick={addVehicle} className="btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Vehicle
              </button>
            </div>
          </section>
        )}

        {/* Vehicles List */}
        <section className="modern-card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-xl">🚗</span>
              </div>
              <h2 className="text-xl font-bold text-white">Fleet Vehicles</h2>
            </div>
            <div className="text-sm text-gray-400">{totalCount} vehicles</div>
          </div>
          
          <div className="space-y-4">
            {visibleVehicles.map((v, index) => (
              <div key={v.id} className="modern-card hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: `${(index + 6) * 0.1}s` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-xl">🚗</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{v.label}</h3>
                      <div className="text-sm text-gray-400 mb-2">
                        {[v.plate, v.vin, [v.make, v.model, v.year].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
                      </div>
                      {v.notes && (
                        <p className="text-sm text-gray-500">{v.notes}</p>
                      )}
                      {v.initialOdometer && (
                        <div className="mt-2 text-xs text-gray-500">
                          Starting odometer: {v.initialOdometer.toLocaleString()} miles
                        </div>
                      )}
                    </div>
                  </div>
                  {role === 'admin' && (
                    <button 
                      onClick={() => removeVehicle(v.id)} 
                      className="btn-secondary text-red-400 hover:text-red-300 hover:border-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {visibleVehicles.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚗</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No vehicles yet</h3>
                <p className="text-gray-400">Add your first vehicle to get started with fleet management.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}


