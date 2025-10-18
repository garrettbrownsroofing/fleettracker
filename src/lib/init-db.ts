// Database initialization script
import { initializeDatabase } from './database'

// Initialize database on startup
export async function initDatabase() {
  try {
    await initializeDatabase()
    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    // Don't throw error to prevent app from crashing
    // The app can still work with fallback mechanisms
  }
}

// Call initialization when this module is imported
if (typeof window === 'undefined') {
  // Only run on server side
  initDatabase()
}
