// API endpoints mapping
const API_ENDPOINTS = {
  'bft:vehicles': '/api/vehicles',
  'bft:drivers': '/api/drivers',
  'bft:assignments': '/api/assignments',
  'bft:maintenance': '/api/maintenance',
} as const

// Fallback to localStorage for keys not in API_ENDPOINTS
export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  
  // Check if this key has an API endpoint
  const apiEndpoint = API_ENDPOINTS[key as keyof typeof API_ENDPOINTS]
  
  if (apiEndpoint) {
    // For API endpoints, we'll use a different approach with React state
    // This function will be used for initial fallback, but components should use API calls
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  } else {
    // For non-API keys, use localStorage as before
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  
  // Check if this key has an API endpoint
  const apiEndpoint = API_ENDPOINTS[key as keyof typeof API_ENDPOINTS]
  
  if (apiEndpoint) {
    // For API endpoints, we'll use a different approach with React state
    // This function will be used for initial fallback, but components should use API calls
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  } else {
    // For non-API keys, use localStorage as before
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  }
}

// API service functions
export async function apiGet<T>(endpoint: string): Promise<T> {
  console.log('🌐 API GET:', endpoint)
  const response = await fetch(endpoint, { cache: 'no-store' })
  if (!response.ok) {
    console.error('❌ API GET failed:', endpoint, response.statusText)
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`)
  }
  const data = await response.json()
  console.log('✅ API GET success:', endpoint, Array.isArray(data) ? `${data.length} items` : 'single item')
  return data
}

export async function apiPost<T>(endpoint: string, data: T): Promise<T> {
  console.log('🌐 API POST:', endpoint, data)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    console.error('❌ API POST failed:', endpoint, response.statusText)
    throw new Error(`Failed to post to ${endpoint}: ${response.statusText}`)
  }
  const result = await response.json()
  console.log('✅ API POST success:', endpoint, result)
  return result
}

export async function apiPut<T>(endpoint: string, data: T): Promise<T> {
  console.log('🌐 API PUT:', endpoint, data)
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    console.error('❌ API PUT failed:', endpoint, response.statusText)
    throw new Error(`Failed to put to ${endpoint}: ${response.statusText}`)
  }
  const result = await response.json()
  console.log('✅ API PUT success:', endpoint, result)
  return result
}

export async function apiDelete(endpoint: string, id: string): Promise<void> {
  console.log('🌐 API DELETE:', endpoint, id)
  const response = await fetch(`${endpoint}?id=${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    console.error('❌ API DELETE failed:', endpoint, response.statusText)
    throw new Error(`Failed to delete from ${endpoint}: ${response.statusText}`)
  }
  console.log('✅ API DELETE success:', endpoint, id)
}


