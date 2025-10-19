'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson, writeJson } from '@/lib/storage'
import type { Assignment, Receipt, Vehicle } from '@/types/fleet'

const STORAGE_RECEIPTS = 'bft:receipts'

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

export default function ReceiptsPage() {
  const { user, isAuthenticated } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated === false) {
    return null
  }

  const assignments = readJson<Assignment[]>('bft:assignments', [])
  const vehicles = readJson<Vehicle[]>('bft:vehicles', [])
  const myVehicleIds = useMemo(() => new Set(assignments.filter(a => a.driverId === user!.id).map(a => a.vehicleId)), [assignments, user])
  const myVehicles = vehicles.filter(v => myVehicleIds.has(v.id))

  const [form, setForm] = useState<{ vehicleId: string; date: string; amount: string; notes: string; files: File[] }>({
    vehicleId: myVehicles[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    notes: '',
    files: [],
  })

  async function submit() {
    if (!form.vehicleId) return
    const images: string[] = []
    for (const f of form.files) {
      images.push(await fileToDataUrl(f))
    }
    const receipts = readJson<Receipt[]>(STORAGE_RECEIPTS, [])
    const rec: Receipt = {
      id: generateId(),
      vehicleId: form.vehicleId,
      driverId: user!.id,
      date: form.date,
      amountCents: form.amount ? Math.round(Number(form.amount) * 100) : undefined,
      notes: form.notes || undefined,
      images,
    }
    writeJson(STORAGE_RECEIPTS, [rec, ...receipts])
    setForm(f => ({ ...f, amount: '', notes: '', files: [] }))
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Service Receipts</h1>
      <div className="p-4 rounded-lg border bg-white space-y-3">
        <select
          className="w-full px-3 py-2 rounded border"
          value={form.vehicleId}
          onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
        >
          <option value="">Select vehicle</option>
          {myVehicles.map(v => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
        <input className="w-full px-3 py-2 rounded border" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded border" placeholder="Amount (USD)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded border" placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <input className="w-full" type="file" accept="image/*" multiple onChange={e => setForm(f => ({ ...f, files: Array.from(e.target.files || []) }))} />
        <button onClick={submit} className="w-full px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Upload</button>
      </div>
    </main>
  )
}


