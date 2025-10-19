'use client'

import { useMemo, useState, useEffect } from 'react'
import type { Vehicle } from '@/types/fleet'
import { readJson, writeJson, apiGet, apiPost, apiPut, apiDelete } from '@/lib/storage'
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ label: '', plate: '', vin: '' })
  const [isAddVehicleExpanded, setIsAddVehicleExpanded] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editVehicle, setEditVehicle] = useState<Partial<Vehicle>>({})
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  
  // Wait for session to be hydrated before redirecting
  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])
  
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

  const visibleVehicles = useMemo(() => {
    if (role === 'admin') return vehicles
    if (!user) return []
    const assignedVehicleIds = new Set(assignments.filter(a => a.driverId === user.id).map(a => a.vehicleId))
    return vehicles.filter(v => assignedVehicleIds.has(v.id))
  }, [vehicles, role, user, assignments])

  const totalCount = useMemo(() => visibleVehicles.length, [visibleVehicles])

  // Load data from API on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [vehiclesData, assignmentsData] = await Promise.all([
          apiGet<Vehicle[]>('/api/vehicles'),
          apiGet<Assignment[]>('/api/assignments')
        ])
        setVehicles(vehiclesData)
        setAssignments(assignmentsData)
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback to localStorage if API fails
        setVehicles(readJson<Vehicle[]>(STORAGE_KEY, []))
        setAssignments(readJson<Assignment[]>('bft:assignments', []))
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function addVehicle() {
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
    
    try {
      const savedVehicle = await apiPost<Vehicle>('/api/vehicles', vehicle)
      setVehicles(prev => [savedVehicle, ...prev])
      setNewVehicle({ label: '', plate: '', vin: '' })
      setIsAddVehicleExpanded(false) // Collapse form after adding
    } catch (error) {
      console.error('Failed to add vehicle:', error)
      // Fallback to localStorage
      setVehicles(prev => [vehicle, ...prev])
      setNewVehicle({ label: '', plate: '', vin: '' })
      setIsAddVehicleExpanded(false)
    }
  }

  async function removeVehicle(id: string) {
    try {
      await apiDelete('/api/vehicles', id)
      setVehicles(prev => prev.filter(v => v.id !== id))
    } catch (error) {
      console.error('Failed to remove vehicle:', error)
      // Fallback to localStorage
      setVehicles(prev => prev.filter(v => v.id !== id))
    }
  }

  function startEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
    setEditVehicle({ ...vehicle })
  }

  function cancelEditVehicle() {
    setEditingVehicle(null)
    setEditVehicle({})
  }

  async function saveEditVehicle() {
    if (!editingVehicle) return
    
    const label = (editVehicle.label || '').trim()
    if (!label) return
    
    const updatedVehicle: Vehicle = {
      ...editingVehicle,
      label,
      plate: (editVehicle.plate || '').trim() || undefined,
      vin: (editVehicle.vin || '').trim() || undefined,
      make: (editVehicle.make || '').trim() || undefined,
      model: (editVehicle.model || '').trim() || undefined,
      year: editVehicle.year ? Number(editVehicle.year) : undefined,
      notes: (editVehicle.notes || '').trim() || undefined,
      initialOdometer: editVehicle.initialOdometer ? Number(editVehicle.initialOdometer) : undefined,
    }
    
    try {
      const savedVehicle = await apiPut<Vehicle>('/api/vehicles', updatedVehicle)
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? savedVehicle : v))
      setEditingVehicle(null)
      setEditVehicle({})
    } catch (error) {
      console.error('Failed to update vehicle:', error)
      // Fallback to localStorage
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? updatedVehicle : v))
      setEditingVehicle(null)
      setEditVehicle({})
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">🛻</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading vehicles...</h3>
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
                <span className="text-2xl">🛻</span>
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
            <button
              onClick={() => setIsAddVehicleExpanded(!isAddVehicleExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Add New Vehicle</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {isAddVehicleExpanded ? 'Collapse' : 'Expand'}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    isAddVehicleExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isAddVehicleExpanded && (
              <div className="mt-6 animate-fade-in">
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
                <div className="mt-6 flex gap-3">
                  <button onClick={addVehicle} className="btn-primary">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Vehicle
                  </button>
                  <button 
                    onClick={() => setIsAddVehicleExpanded(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Vehicles List */}
        <section className="modern-card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-xl">🛻</span>
              </div>
              <h2 className="text-xl font-bold text-white">Fleet Vehicles</h2>
            </div>
            <div className="text-sm text-gray-400">{totalCount} vehicles</div>
          </div>
          
          <div className="space-y-4">
            {visibleVehicles.map((v, index) => (
              <div key={v.id} className="modern-card hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: `${(index + 6) * 0.1}s` }}>
                {editingVehicle?.id === v.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Edit Vehicle</h3>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Label</label>
                        <input
                          className="modern-input w-full"
                          placeholder="e.g., Truck 12, Van 5"
                          value={editVehicle.label || ''}
                          onChange={e => setEditVehicle(ev => ({ ...ev, label: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">License Plate</label>
                        <input
                          className="modern-input w-full"
                          placeholder="ABC-123"
                          value={editVehicle.plate || ''}
                          onChange={e => setEditVehicle(ev => ({ ...ev, plate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">VIN Number</label>
                        <input
                          className="modern-input w-full"
                          placeholder="1HGBH41JXMN109186"
                          value={editVehicle.vin || ''}
                          onChange={e => setEditVehicle(ev => ({ ...ev, vin: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Starting Odometer</label>
                        <input
                          className="modern-input w-full"
                          placeholder="0"
                          inputMode="numeric"
                          value={(editVehicle.initialOdometer as any)?.toString?.() || ''}
                          onChange={e => setEditVehicle(ev => ({ ...ev, initialOdometer: Number(e.target.value) || undefined }))}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Make</label>
                          <input
                            className="modern-input w-full"
                            placeholder="Ford"
                            value={editVehicle.make || ''}
                            onChange={e => setEditVehicle(ev => ({ ...ev, make: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                          <input
                            className="modern-input w-full"
                            placeholder="Transit"
                            value={editVehicle.model || ''}
                            onChange={e => setEditVehicle(ev => ({ ...ev, model: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                          <input
                            className="modern-input w-full"
                            placeholder="2023"
                            inputMode="numeric"
                            value={editVehicle.year?.toString() || ''}
                            onChange={e => setEditVehicle(ev => ({ ...ev, year: Number(e.target.value) || undefined }))}
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                        <textarea
                          className="modern-input w-full h-20 resize-none"
                          placeholder="Additional notes about this vehicle..."
                          value={editVehicle.notes || ''}
                          onChange={e => setEditVehicle(ev => ({ ...ev, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button onClick={saveEditVehicle} className="btn-primary">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </button>
                      <button onClick={cancelEditVehicle} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal View
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-xl">🛻</span>
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
                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditVehicle(v)} 
                          className="btn-secondary text-blue-400 hover:text-blue-300 hover:border-blue-400"
                          title="Edit Vehicle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => removeVehicle(v.id)} 
                          className="btn-secondary text-red-400 hover:text-red-300 hover:border-red-400"
                          title="Delete Vehicle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {visibleVehicles.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛻</span>
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


