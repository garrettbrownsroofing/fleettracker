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
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Assignments</h1>
        <p className="text-gray-600">Access restricted to admin.</p>
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
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Assignments</h1>

      <section className="mb-6 p-4 rounded-lg border bg-white">
        <h2 className="font-medium mb-3">Create assignment</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="px-3 py-2 rounded border"
            value={form.vehicleId || ''}
            onChange={e => setForm(v => ({ ...v, vehicleId: e.target.value }))}
          >
            <option value="">Select vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded border"
            value={form.driverId || ''}
            onChange={e => setForm(v => ({ ...v, driverId: e.target.value }))}
          >
            <option value="">Select driver</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            className="px-3 py-2 rounded border"
            type="date"
            value={form.startDate || ''}
            onChange={e => setForm(v => ({ ...v, startDate: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border"
            type="date"
            value={form.endDate || ''}
            onChange={e => setForm(v => ({ ...v, endDate: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border sm:col-span-2"
            placeholder="Job"
            value={form.job || ''}
            onChange={e => setForm(v => ({ ...v, job: e.target.value }))}
          />
          <textarea
            className="px-3 py-2 rounded border sm:col-span-2"
            placeholder="Notes"
            value={form.notes || ''}
            onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button onClick={addAssignment} className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Add</button>
        </div>
      </section>

      <section className="p-4 rounded-lg border bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">All assignments</h2>
          <div className="text-sm text-gray-600">{totalCount} total</div>
        </div>
        <ul className="mt-3 divide-y">
          {assignments.map(a => (
            <li key={a.id} className="py-3 flex items-start gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{labelForVehicle(a.vehicleId)} → {nameForDriver(a.driverId)}</div>
                <div className="text-sm text-gray-600 truncate">
                  {[a.startDate, a.endDate ? `to ${a.endDate}` : undefined, a.job].filter(Boolean).join(' · ')}
                </div>
                {a.notes ? <div className="text-sm text-gray-600 mt-1">{a.notes}</div> : null}
              </div>
              <div className="ml-auto">
                <button onClick={() => removeAssignment(a.id)} className="px-3 py-1.5 rounded border hover:bg-gray-50">Remove</button>
              </div>
            </li>
          ))}
          {assignments.length === 0 && (
            <li className="py-6 text-center text-gray-500">No assignments yet</li>
          )}
        </ul>
      </section>
    </main>
  )
}


