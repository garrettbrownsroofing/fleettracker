'use client'

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Brown's Fleet Tracker</h1>
      <p className="text-gray-600 mb-8">Fresh start. Minimal scaffold is ready.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <a href="#" className="p-4 rounded-lg border bg-white hover:shadow">
          <div className="font-semibold mb-1">Vehicles</div>
          <div className="text-sm text-gray-600">Add vehicles, VINs, plates</div>
        </a>
        <a href="#" className="p-4 rounded-lg border bg-white hover:shadow">
          <div className="font-semibold mb-1">Assignments</div>
          <div className="text-sm text-gray-600">Assign drivers and jobs</div>
        </a>
      </div>
    </main>
  )
}


