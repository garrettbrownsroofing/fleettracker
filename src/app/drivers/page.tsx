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
    <main className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">Driver Management</h1>
          <p className="text-gray-400 text-lg">
            Manage your fleet drivers and their contact information.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalCount}</div>
                <div className="text-sm text-gray-400">Total Drivers</div>
              </div>
            </div>
          </div>
          <div className="modern-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalCount}</div>
                <div className="text-sm text-gray-400">Active Drivers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Driver Form */}
        <section className="mb-8 modern-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Add New Driver</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                className="modern-input w-full"
                placeholder="John Smith"
                value={newDriver.name || ''}
                onChange={e => setNewDriver(v => ({ ...v, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <input
                className="modern-input w-full"
                placeholder="(555) 123-4567"
                value={newDriver.phone || ''}
                onChange={e => setNewDriver(v => ({ ...v, phone: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                className="modern-input w-full"
                placeholder="john.smith@company.com"
                value={newDriver.email || ''}
                onChange={e => setNewDriver(v => ({ ...v, email: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                className="modern-input w-full h-20 resize-none"
                placeholder="Additional notes about this driver..."
                value={newDriver.notes || ''}
                onChange={e => setNewDriver(v => ({ ...v, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-6">
            <button onClick={addDriver} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Driver
            </button>
          </div>
        </section>

        {/* Drivers List */}
        <section className="modern-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-xl">👨‍💼</span>
              </div>
              <h2 className="text-xl font-bold text-white">All Drivers</h2>
            </div>
            <div className="text-sm text-gray-400">{totalCount} drivers</div>
          </div>
          
          <div className="space-y-4">
            {drivers.map((d, index) => (
              <div key={d.id} className="modern-card hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: `${(index + 5) * 0.1}s` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-xl">👨‍💼</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{d.name}</h3>
                      <div className="text-sm text-gray-400 mb-2">
                        {[d.phone, d.email].filter(Boolean).join(' · ')}
                      </div>
                      {d.notes && (
                        <p className="text-sm text-gray-500">{d.notes}</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeDriver(d.id)} 
                    className="btn-secondary text-red-400 hover:text-red-300 hover:border-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {drivers.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No drivers yet</h3>
                <p className="text-gray-400">Add your first driver to get started.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}


