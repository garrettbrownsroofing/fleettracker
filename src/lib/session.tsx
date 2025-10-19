'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { readJson, writeJson } from '@/lib/storage'

export type Role = 'admin' | 'user'

export type SessionUser = {
  id: string
  name: string
}

type SessionState = {
  role: Role
  user: SessionUser | null
  isAuthenticated: boolean | null
  login: (username: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

const STORAGE_KEY = 'bft:session'

const SessionContext = createContext<SessionState | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('user')
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Don't consider authenticated until hydrated to prevent flash redirects
  const isAuthenticated = isHydrated ? !!user : null

  // Load session data after hydration
  useEffect(() => {
    try {
      console.log('Loading session data...')
      console.log('Available localStorage keys:', Object.keys(localStorage))
      const savedRole = readJson<Role>(`${STORAGE_KEY}:role`, 'user')
      const savedUser = readJson<SessionUser | null>(`${STORAGE_KEY}:user`, null)
      console.log('Loaded session data:', { savedRole, savedUser })
      console.log('Raw localStorage values:', {
        role: localStorage.getItem(`${STORAGE_KEY}:role`),
        user: localStorage.getItem(`${STORAGE_KEY}:user`)
      })
      setRole(savedRole)
      setUser(savedUser)
    } catch (error) {
      console.error('Error loading session data:', error)
      // Reset to defaults on error
      setRole('user')
      setUser(null)
    } finally {
      console.log('Session hydration complete')
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => { 
    if (isHydrated) {
      try {
        writeJson(`${STORAGE_KEY}:role`, role)
      } catch (error) {
        console.error('Error saving role:', error)
      }
    }
  }, [role, isHydrated])
  
  useEffect(() => { 
    if (isHydrated) {
      try {
        writeJson(`${STORAGE_KEY}:user`, user)
      } catch (error) {
        console.error('Error saving user:', error)
      }
    }
  }, [user, isHydrated])

  function normalizeIdFromName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-')
  }

  function login(username: string, password: string): { ok: boolean; error?: string } {
    const trimmed = username.trim()
    if (!trimmed) return { ok: false, error: 'Enter a username' }
    if (password !== 'BrownsFleet1!') return { ok: false, error: 'Invalid password' }

    if (trimmed.toLowerCase() === 'admin') {
      setUser({ id: 'admin', name: 'Admin' })
      setRole('admin')
      return { ok: true }
    }

    // Validate against Drivers by name, normalized id, or email from localStorage
    const drivers = readJson<Array<{ id: string; name: string; email?: string }>>('bft:drivers', [])
    const inputLower = trimmed.toLowerCase()
    const match = drivers.find(d => {
      const nameLower = (d.name || '').trim().toLowerCase()
      const normId = (d.id || normalizeIdFromName(d.name || ''))
      const normIdLower = normId.toLowerCase()
      const emailLower = (d.email || '').trim().toLowerCase()
      return (
        inputLower === nameLower ||
        inputLower === normIdLower ||
        (emailLower && inputLower === emailLower)
      )
    })
    if (!match) {
      return { ok: false, error: 'User not found. Ask admin to add driver.' }
    }

    setUser({ id: match.id || normalizeIdFromName(match.name), name: match.name })
    setRole('user')
    return { ok: true }
  }

  function logout() {
    setUser(null)
    setRole('user')
  }

  const value = useMemo<SessionState>(
    () => ({ role, user, isAuthenticated, login, logout }),
    [role, user, isAuthenticated]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  try {
    const ctx = useContext(SessionContext)
    if (!ctx) {
      console.error('useSession called outside of SessionProvider')
      throw new Error('useSession must be used within SessionProvider')
    }
    return ctx
  } catch (error) {
    console.error('Error in useSession hook:', error)
    throw error
  }
}


