'use client'

import { useMemo, useState } from 'react'
import type { Assignment, Driver, Vehicle } from '@/types/fleet'
import { readJson, writeJson } from '@/lib/storage'
import { useSession } from '@/lib/session'
import { useRouter } from 'next/navigation'

const STORAGE_ASSIGN = 'bft:assignments'
const STORAGE_DRIVERS = 'bft:drivers'
const STORAGE_VEHICLES = 'bft:vehicles'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function AssignmentsPage() {
  const { role, isAuthenticated } = useSession()
  const router = useRouter()
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }
  if (role !== 'admin') {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="modern-card text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
            <p className="text-gray-400">This page is only available to administrators.</p>
          </div>
        </div>
      </main>
    )
  }
  const [assignments, setAssignments] = useState<Assignment[]>(() => readJson<Assignment[]>(STORAGE_ASSIGN, []))
  const drivers = readJson<Driver[]>(STORAGE_DRIVERS, [])
  const vehicles = readJson<Vehicle[]>(STORAGE_VEHICLES, [])

  const [form, setForm] = useState<Partial<Assignment>>({ startDate: new Date().toISOString().slice(0, 10) })

  const totalCount = useMemo(() => assignments.length, [assignments])

  function addAssignment() {
    const vehicleId = form.vehicleId?.trim()
    const driverId = form.driverId?.trim()
    const startDate = (form.startDate || '').trim()
    if (!vehicleId || !driverId || !startDate) return
    const assignment: Assignment = {
      id: generateId(),
      vehicleId,
      driverId,
      startDate,
      endDate: form.endDate || undefined,
      job: form.job?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    }
    const next = [assignment, ...assignments]
    setAssignments(next)
    writeJson(STORAGE_ASSIGN, next)
    setForm({ startDate })
  }

  function removeAssignment(id: string) {
    const next = assignments.filter(a => a.id !== id)
    setAssignments(next)
    writeJson(STORAGE_ASSIGN, next)
  }

  function nameForDriver(id: string) {
    return drivers.find(d => d.id === id)?.name || 'Unknown driver'
  }
  function labelForVehicle(id: string) {
    return vehicles.find(v => v.id === id)?.label || 'Unknown vehicle'
  }

  return (
    <main className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">Driver Assignments</h1>
          <p className="text-gray-400 text-lg">
            Manage vehicle assignments and job schedules for your drivers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalCount}</div>
                <div className="text-sm text-gray-400">Total Assignments</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{vehicles.length}</div>
                <div className="text-sm text-gray-400">Available Vehicles</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{drivers.length}</div>
                <div className="text-sm text-gray-400">Active Drivers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Assignment Form */}
        <section className="mb-8 modern-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Create New Assignment</h2>
          </div>
          
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Driver</label>
              <select
                className="modern-input w-full"
                value={form.driverId || ''}
                onChange={e => setForm(v => ({ ...v, driverId: e.target.value }))}
              >
                <option value="">Select driver</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                className="modern-input w-full"
                type="date"
                value={form.startDate || ''}
                onChange={e => setForm(v => ({ ...v, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date (Optional)</label>
              <input
                className="modern-input w-full"
                type="date"
                value={form.endDate || ''}
                onChange={e => setForm(v => ({ ...v, endDate: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Description</label>
              <input
                className="modern-input w-full"
                placeholder="e.g., Delivery to downtown, Maintenance run"
                value={form.job || ''}
                onChange={e => setForm(v => ({ ...v, job: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                className="modern-input w-full h-20 resize-none"
                placeholder="Additional notes about this assignment..."
                value={form.notes || ''}
                onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-6">
            <button onClick={addAssignment} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Assignment
            </button>
          </div>
        </section>

        {/* Assignments List */}
        <section className="modern-card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <h2 className="text-xl font-bold text-white">All Assignments</h2>
            </div>
            <div className="text-sm text-gray-400">{totalCount} assignments</div>
          </div>
          
          <div className="space-y-4">
            {assignments.map((a, index) => (
              <div key={a.id} className="modern-card hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: `${(index + 6) * 0.1}s` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-xl">👥</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {labelForVehicle(a.vehicleId)} → {nameForDriver(a.driverId)}
                      </h3>
                      <div className="text-sm text-gray-400 mb-2">
                        {[a.startDate, a.endDate ? `to ${a.endDate}` : undefined, a.job].filter(Boolean).join(' · ')}
                      </div>
                      {a.notes && (
                        <p className="text-sm text-gray-500">{a.notes}</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeAssignment(a.id)} 
                    className="btn-secondary text-red-400 hover:text-red-300 hover:border-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {assignments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No assignments yet</h3>
                <p className="text-gray-400">Create your first assignment to get started.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}


