import './globals.css'
import type { Metadata } from 'next'
import { SessionProvider } from '@/lib/session'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: "Brown's Fleet Tracker",
  description: 'Track vehicles, assignments, and maintenance at a glance.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen gradient-bg text-white">
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}


