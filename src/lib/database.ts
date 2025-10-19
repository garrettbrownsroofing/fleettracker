// Database configuration and connection utilities
import { Firestore } from '@google-cloud/firestore'

// Environment variables for database configuration
const DB_TYPE = process.env.DB_TYPE || 'firestore'
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID

// Firestore configuration
let firestore: Firestore | null = null
export function getFirestore(): Firestore {
  if (!firestore) {
    if (!PROJECT_ID) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required for Firestore')
    }
    
    const config: any = {
      projectId: PROJECT_ID,
      ignoreUndefinedProperties: true,
    }
    
    // If we have service account credentials, use them
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        config.credentials = credentials
      } catch (error) {
        console.warn('Failed to parse service account credentials:', error)
      }
    }
    
    firestore = new Firestore(config)
  }
  return firestore
}

// Database initialization
export async function initializeDatabase(): Promise<void> {
  try {
    if (DB_TYPE === 'firestore') {
      const db = getFirestore()
      // Test connection
      await db.collection('_test').limit(1).get()
      console.log('✅ Firestore connection established')
    } else {
      console.log('❌ Only Firestore is supported in this configuration')
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Get current database type
export function getDatabaseType(): string {
  return DB_TYPE
}