'use client'

import { useMemo, useState } from 'react'
import type { Driver } from '@/types/fleet'
import { readJson, writeJson } from '@/lib/storage'
import { useSession } from '@/lib/session'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'bft:drivers'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function DriversPage() {
  const { role, isAuthenticated } = useSession()
  const router = useRouter()
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }
  if (role !== 'admin') {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Drivers</h1>
        <p className="text-gray-600">Access restricted to admin.</p>
      </main>
    )
  }
  const [drivers, setDrivers] = useState<Driver[]>(() => readJson<Driver[]>(STORAGE_KEY, []))
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({ name: '', phone: '', email: '' })

  const totalCount = useMemo(() => drivers.length, [drivers])

  function addDriver() {
    const name = (newDriver.name || '').trim()
    if (!name) return
    const driver: Driver = {
      id: generateId(),
      name,
      phone: (newDriver.phone || '').trim() || undefined,
      email: (newDriver.email || '').trim() || undefined,
      notes: (newDriver.notes || '').trim() || undefined,
    }
    const next = [driver, ...drivers]
    setDrivers(next)
    writeJson(STORAGE_KEY, next)
    setNewDriver({ name: '', phone: '', email: '' })
  }

  function removeDriver(id: string) {
    const next = drivers.filter(d => d.id !== id)
    setDrivers(next)
    writeJson(STORAGE_KEY, next)
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Drivers</h1>

      <section className="mb-6 p-4 rounded-lg border bg-white">
        <h2 className="font-medium mb-3">Add driver</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="px-3 py-2 rounded border"
            placeholder="Full name"
            value={newDriver.name || ''}
            onChange={e => setNewDriver(v => ({ ...v, name: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border"
            placeholder="Phone"
            value={newDriver.phone || ''}
            onChange={e => setNewDriver(v => ({ ...v, phone: e.target.value }))}
          />
          <input
            className="px-3 py-2 rounded border sm:col-span-2"
            placeholder="Email"
            value={newDriver.email || ''}
            onChange={e => setNewDriver(v => ({ ...v, email: e.target.value }))}
          />
          <textarea
            className="px-3 py-2 rounded border sm:col-span-2"
            placeholder="Notes"
            value={newDriver.notes || ''}
            onChange={e => setNewDriver(v => ({ ...v, notes: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button onClick={addDriver} className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Add</button>
        </div>
      </section>

      <section className="p-4 rounded-lg border bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">All drivers</h2>
          <div className="text-sm text-gray-600">{totalCount} total</div>
        </div>
        <ul className="mt-3 divide-y">
          {drivers.map(d => (
            <li key={d.id} className="py-3 flex items-start gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{d.name}</div>
                <div className="text-sm text-gray-600 truncate">{[d.phone, d.email].filter(Boolean).join(' · ')}</div>
                {d.notes ? <div className="text-sm text-gray-600 mt-1">{d.notes}</div> : null}
              </div>
              <div className="ml-auto">
                <button onClick={() => removeDriver(d.id)} className="px-3 py-1.5 rounded border hover:bg-gray-50">Remove</button>
              </div>
            </li>
          ))}
          {drivers.length === 0 && (
            <li className="py-6 text-center text-gray-500">No drivers yet</li>
          )}
        </ul>
      </section>
    </main>
  )
}


