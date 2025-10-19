'use client'

import { useMemo, useState, useEffect } from 'react'
import type { MaintenanceRecord, Vehicle, Assignment } from '@/types/fleet'
import { readJson, writeJson, apiGet, apiPost, apiDelete } from '@/lib/storage'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useSession } from '@/lib/session'
import { useRouter } from 'next/navigation'

const STORAGE_MAINT = 'bft:maintenance'
const STORAGE_VEHICLES = 'bft:vehicles'

const MAINTENANCE_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection/Service',
  'Engine Tune Up',
  'Fluid Check',
  'Filter Replacement',
  'Other'
]

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

function MaintenancePageContent() {
  const { role, user, isAuthenticated } = useSession()
  const router = useRouter()
  
  // Wait for session to be hydrated before redirecting
  useEffect(() => {
    console.log('Maintenance page - Authentication state:', { isAuthenticated, role, user })
    if (isAuthenticated === false) {
      console.log('User not authenticated, redirecting to login')
      router.replace('/login')
    }
  }, [isAuthenticated, role, user, router])

  if (isAuthenticated === false) {
    return null
  }
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [isAddRecordExpanded, setIsAddRecordExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<Partial<MaintenanceRecord> & { receiptFiles: File[], customServiceType?: string }>({ 
    date: new Date().toISOString().slice(0,10),
    receiptFiles: []
  })

  const visibleVehicleIds = useMemo(() => {
    if (role === 'admin') return new Set(vehicles.map(v => v.id))
    if (!user) return new Set<string>()
    return new Set(assignments.filter(a => a.driverId === user.id).map(a => a.vehicleId))
  }, [role, user, assignments, vehicles])

  const visibleRecords = useMemo(() => records.filter(r => visibleVehicleIds.has(r.vehicleId)), [records, visibleVehicleIds])

  const filteredRecords = useMemo(() => {
    if (!selectedVehicleId) return visibleRecords
    return visibleRecords.filter(r => r.vehicleId === selectedVehicleId)
  }, [visibleRecords, selectedVehicleId])

  const recordsByVehicle = useMemo(() => {
    const grouped: { [vehicleId: string]: MaintenanceRecord[] } = {}
    visibleRecords.forEach(record => {
      if (!grouped[record.vehicleId]) {
        grouped[record.vehicleId] = []
      }
      grouped[record.vehicleId].push(record)
    })
    return grouped
  }, [visibleRecords])

  const totalCost = useMemo(() => {
    return visibleRecords.reduce((sum, record) => sum + (record.costCents || 0), 0)
  }, [visibleRecords])

  const recentRecords = useMemo(() => {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    return visibleRecords
      .filter(record => new Date(record.date) >= twoWeeksAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [visibleRecords])

  // Load data from API on component mount - only when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      async function loadData() {
        try {
          setLoading(true)
          const [vehiclesData, assignmentsData, recordsData] = await Promise.all([
            apiGet<Vehicle[]>('/api/vehicles'),
            apiGet<Assignment[]>('/api/assignments'),
            apiGet<MaintenanceRecord[]>('/api/maintenance')
          ])
          setVehicles(vehiclesData)
          setAssignments(assignmentsData)
          setRecords(recordsData)
        } catch (error) {
          console.error('Failed to load data:', error)
          // Fallback to localStorage if API fails
          setVehicles(readJson<Vehicle[]>(STORAGE_VEHICLES, []))
          setAssignments(readJson<Assignment[]>('bft:assignments', []))
          setRecords(readJson<MaintenanceRecord[]>(STORAGE_MAINT, []))
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [isAuthenticated])

  async function addRecord() {
    const vehicleId = form.vehicleId?.trim()
    const date = (form.date || '').trim()
    if (!vehicleId || !date) return
    
    // Convert receipt files to data URLs
    const receiptImages: string[] = []
    for (const file of form.receiptFiles || []) {
      try {
        const dataUrl = await fileToDataUrl(file)
        receiptImages.push(dataUrl)
      } catch (error) {
        console.error('Failed to convert file to data URL:', error)
      }
    }
    
    const serviceType = form.type === 'Other' && form.customServiceType 
      ? form.customServiceType.trim() 
      : form.type?.trim()

    const rec: MaintenanceRecord = {
      id: generateId(),
      vehicleId,
      date,
      odometer: form.odometer ? Number(form.odometer) : undefined,
      type: serviceType || undefined,
      costCents: form.costCents ? Number(form.costCents) : undefined,
      vendor: form.vendor?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
    }
    
    try {
      const savedRecord = await apiPost<MaintenanceRecord>('/api/maintenance', rec)
      setRecords(prev => [savedRecord, ...prev])
      setForm({ date: new Date().toISOString().slice(0,10), receiptFiles: [] })
      setIsAddRecordExpanded(false)
    } catch (error) {
      console.error('Failed to add maintenance record:', error)
      // Fallback to localStorage
      const next = [rec, ...records]
      setRecords(next)
      writeJson(STORAGE_MAINT, next)
      setForm({ date: new Date().toISOString().slice(0,10), receiptFiles: [] })
      setIsAddRecordExpanded(false)
    }
  }

  async function removeRecord(id: string) {
    try {
      await apiDelete('/api/maintenance', id)
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to remove maintenance record:', error)
      // Fallback to localStorage
      const next = records.filter(r => r.id !== id)
      setRecords(next)
      writeJson(STORAGE_MAINT, next)
    }
  }

  function getVehicleLabel(vehicleId: string) {
    return vehicles.find(v => v.id === vehicleId)?.label || 'Unknown vehicle'
  }

  // Show loading while session is hydrating
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">🔧</span>
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
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading maintenance data...</h3>
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
          <h1 className="text-4xl font-bold text-white mb-2">Maintenance Records</h1>
          <p className="text-gray-400 text-lg">
            Track and manage vehicle maintenance with detailed records and cost tracking.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{visibleRecords.length}</div>
                <div className="text-sm text-gray-400">Total Records</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${(totalCost / 100).toFixed(0)}</div>
                <div className="text-sm text-gray-400">Total Spent</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-2xl">🛻</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{Object.keys(recordsByVehicle).length}</div>
                <div className="text-sm text-gray-400">Vehicles Serviced</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{recentRecords.length}</div>
                <div className="text-sm text-gray-400">Recent Records (2 weeks)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Record Form - Collapsible */}
        {role === 'admin' && (
          <section className="mb-8 modern-card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <button
              onClick={() => setIsAddRecordExpanded(!isAddRecordExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Add Maintenance Record</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {isAddRecordExpanded ? 'Collapse' : 'Expand'}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    isAddRecordExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isAddRecordExpanded && (
              <div className="mt-6 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle</label>
                    <select
                      className="modern-input w-full"
                      value={form.vehicleId || ''}
                      onChange={e => setForm(v => ({ ...v, vehicleId: e.target.value }))}
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      className="modern-input w-full"
                      type="date"
                      value={form.date || ''}
                      onChange={e => setForm(v => ({ ...v, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Odometer Reading</label>
                    <input
                      className="modern-input w-full"
                      placeholder="12345"
                      inputMode="numeric"
                      value={form.odometer?.toString() || ''}
                      onChange={e => setForm(v => ({ ...v, odometer: Number(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Service Type</label>
                    <select
                      className="modern-input w-full"
                      value={form.type || ''}
                      onChange={e => setForm(v => ({ ...v, type: e.target.value, customServiceType: '' }))}
                    >
                      <option value="">Select service type</option>
                      {MAINTENANCE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {form.type === 'Other' && (
                      <input
                        className="modern-input w-full mt-2"
                        placeholder="Enter custom service type"
                        value={form.customServiceType || ''}
                        onChange={e => setForm(v => ({ ...v, customServiceType: e.target.value }))}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cost (USD)</label>
                    <input
                      className="modern-input w-full"
                      placeholder="150.00"
                      inputMode="numeric"
                      value={form.costCents ? (form.costCents / 100).toString() : ''}
                      onChange={e => setForm(v => ({ ...v, costCents: Math.round((Number(e.target.value) || 0) * 100) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vendor/Shop</label>
                    <input
                      className="modern-input w-full"
                      placeholder="AutoZone, Jiffy Lube, etc."
                      value={form.vendor || ''}
                      onChange={e => setForm(v => ({ ...v, vendor: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                    <textarea
                      className="modern-input w-full h-20 resize-none"
                      placeholder="Additional details about the maintenance performed..."
                      value={form.notes || ''}
                      onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Receipt Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="modern-input w-full"
                      onChange={e => setForm(v => ({ ...v, receiptFiles: Array.from(e.target.files || []) }))}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Upload receipt images for this maintenance record (optional)
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={addRecord} className="btn-primary">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Record
                  </button>
                  <button 
                    onClick={() => setIsAddRecordExpanded(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Vehicle Filter */}
        <section className="mb-8 modern-card animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
              <h2 className="text-xl font-bold text-white">Filter by Vehicle</h2>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <select
              className="modern-input flex-1 max-w-md"
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
            >
              <option value="">All Vehicles ({visibleRecords.length} records)</option>
              {Object.entries(recordsByVehicle).map(([vehicleId, vehicleRecords]) => (
                <option key={vehicleId} value={vehicleId}>
                  {getVehicleLabel(vehicleId)} ({vehicleRecords.length} records)
                </option>
              ))}
            </select>
            {selectedVehicleId && (
              <button
                onClick={() => setSelectedVehicleId('')}
                className="btn-secondary"
              >
                Clear Filter
              </button>
            )}
          </div>
        </section>

        {/* Maintenance Records */}
        <section className="modern-card animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-xl">🔧</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {selectedVehicleId ? `Maintenance for ${getVehicleLabel(selectedVehicleId)}` : 'All Maintenance Records'}
              </h2>
            </div>
            <div className="text-sm text-gray-400">{filteredRecords.length} records</div>
          </div>
          
          <div className="space-y-4">
            {filteredRecords.map((record, index) => (
              <div key={record.id} className="modern-card hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: `${(index + 8) * 0.1}s` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <span className="text-xl">🔧</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{getVehicleLabel(record.vehicleId)}</h3>
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-600/20 text-orange-400 border border-orange-600/30">
                          {record.type || 'Maintenance'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                        {record.odometer && ` · ${record.odometer.toLocaleString()} miles`}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {[record.vendor, record.costCents ? `$${(record.costCents / 100).toFixed(2)}` : undefined].filter(Boolean).join(' · ')}
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-500 mb-2">{record.notes}</p>
                      )}
                      {record.receiptImages && record.receiptImages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-2">Receipt Images:</p>
                          <div className="flex gap-2 flex-wrap">
                            {record.receiptImages.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Receipt ${index + 1}`}
                                className="w-16 h-16 object-cover rounded border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(image, '_blank')}
                                title="Click to view full size"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {role === 'admin' && (
                    <button 
                      onClick={() => removeRecord(record.id)} 
                      className="btn-secondary text-red-400 hover:text-red-300 hover:border-red-400"
                      title="Delete Record"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔧</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {selectedVehicleId ? 'No maintenance records for this vehicle' : 'No maintenance records yet'}
                </h3>
                <p className="text-gray-400">
                  {selectedVehicleId ? 'Try selecting a different vehicle or add a new record.' : 'Add your first maintenance record to get started.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function MaintenancePage() {
  return (
    <ErrorBoundary>
      <MaintenancePageContent />
    </ErrorBoundary>
  )
}


