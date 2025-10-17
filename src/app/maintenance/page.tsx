'use client'

import { useMemo, useState } from 'react'
import type { MaintenanceRecord, Vehicle, Assignment } from '@/types/fleet'
import { readJson, writeJson } from '@/lib/storage'
import { useSession } from '@/lib/session'
import { useRouter } from 'next/navigation'

const STORAGE_MAINT = 'bft:maintenance'
const STORAGE_VEHICLES = 'bft:vehicles'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function MaintenancePage() {
  const { role, user, isAuthenticated } = useSession()
  const router = useRouter()
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }
  const vehicles = readJson<Vehicle[]>(STORAGE_VEHICLES, [])
  const assignments = readJson<Assignment[]>('bft:assignments', [])
  const [records, setRecords] = useState<MaintenanceRecord[]>(() => readJson<MaintenanceRecord[]>(STORAGE_MAINT, []))

  const [form, setForm] = useState<Partial<MaintenanceRecord>>({ date: new Date().toISOString().slice(0,10) })

  const visibleVehicleIds = useMemo(() => {
    if (role === 'admin') return new Set(vehicles.map(v => v.id))
    if (!user) return new Set<string>()
    return new Set(assignments.filter(a => a.driverId === user.id).map(a => a.vehicleId))
  }, [role, user, assignments, vehicles])

  const visibleRecords = useMemo(() => records.filter(r => visibleVehicleIds.has(r.vehicleId)), [records, visibleVehicleIds])

  function addRecord() {
    const vehicleId = form.vehicleId?.trim()
    const date = (form.date || '').trim()
    if (!vehicleId || !date) return
    const rec: MaintenanceRecord = {
      id: generateId(),
      vehicleId,
      date,
      odometer: form.odometer ? Number(form.odometer) : undefined,
      type: form.type?.trim() || undefined,
      costCents: form.costCents ? Number(form.costCents) : undefined,
      vendor: form.vendor?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    }
    const next = [rec, ...records]
    setRecords(next)
    writeJson(STORAGE_MAINT, next)
    setForm({ date })
  }

  function removeRecord(id: string) {
    const next = records.filter(r => r.id !== id)
    setRecords(next)
    writeJson(STORAGE_MAINT, next)
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Maintenance</h1>

      {role === 'admin' && (
      <section className="mb-6 p-4 rounded-lg border bg-white">
        <h2 className="font-medium mb-3">Add record</h2>
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
          <input
            className="px-3 py-2 rounded border"
            type="date"
            value={form.date || ''}
            onChange={e => setForm(v => ({ ...v, date: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border"
            placeholder="Odometer"
            inputMode="numeric"
            value={form.odometer?.toString() || ''}
            onChange={e => setForm(v => ({ ...v, odometer: Number(e.target.value) || undefined }))}
          />
          <input
            className="px-3 py-2 rounded border"
            placeholder="Type (Oil Change, Tires, etc.)"
            value={form.type || ''}
            onChange={e => setForm(v => ({ ...v, type: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border"
            placeholder="Cost (USD)"
            inputMode="numeric"
            value={form.costCents ? (form.costCents / 100).toString() : ''}
            onChange={e => setForm(v => ({ ...v, costCents: Math.round((Number(e.target.value) || 0) * 100) }))}
          />
          <input
            className="px-3 py-2 rounded border"
            placeholder="Vendor"
            value={form.vendor || ''}
            onChange={e => setForm(v => ({ ...v, vendor: e.target.value }))}
          />
          <textarea
            className="px-3 py-2 rounded border sm:col-span-2"
            placeholder="Notes"
            value={form.notes || ''}
            onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button onClick={addRecord} className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Add</button>
        </div>
      </section>
      )}

      <section className="p-4 rounded-lg border bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">All records</h2>
          <div className="text-sm text-gray-600">{visibleRecords.length} total</div>
        </div>
        <ul className="mt-3 divide-y">
          {visibleRecords.map(r => (
            <li key={r.id} className="py-3">
              <div className="font-medium">{vehicles.find(v => v.id === r.vehicleId)?.label || 'Unknown vehicle'}</div>
              <div className="text-sm text-gray-600">{r.date} · {r.type || 'Maintenance'}</div>
              <div className="text-sm text-gray-600">
                {[r.vendor, r.odometer ? `${r.odometer} mi` : undefined, r.costCents ? `$${(r.costCents / 100).toFixed(2)}` : undefined].filter(Boolean).join(' · ')}
              </div>
              {r.notes ? <div className="text-sm text-gray-600 mt-1">{r.notes}</div> : null}
              {role === 'admin' && (
                <div className="mt-2">
                  <button onClick={() => removeRecord(r.id)} className="px-3 py-1.5 rounded border hover:bg-gray-50">Remove</button>
                </div>
              )}
            </li>
          ))}
          {visibleRecords.length === 0 && (
            <li className="py-6 text-center text-gray-500">No maintenance records yet</li>
          )}
        </ul>
      </section>
    </main>
  )
}


