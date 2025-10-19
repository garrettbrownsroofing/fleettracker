import './globals.css'
import type { Metadata } from 'next'
import { SessionProvider } from '@/lib/session'
import ConditionalHeader from '@/components/ConditionalHeader'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: "Brown's Fleet Tracker",
  description: 'Track vehicles, assignments, and maintenance at a glance.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen gradient-bg text-white">
        <ErrorBoundary>
          <SessionProvider>
            <ConditionalHeader />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}


