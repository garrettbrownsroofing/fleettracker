import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Brown's Fleet Tracker",
  description: 'Track vehicles, assignments, and maintenance at a glance.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}


