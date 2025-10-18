// Database configuration and connection utilities
import { Firestore } from '@google-cloud/firestore'
import { Pool } from 'pg'

// Environment variables for database configuration
const DB_TYPE = process.env.DB_TYPE || 'firestore' // 'firestore', 'postgres', 'mysql'
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID
const DB_CONNECTION_STRING = process.env.DATABASE_URL
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD

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

// PostgreSQL configuration
let pgPool: Pool | null = null
export function getPostgresPool(): Pool {
  if (!pgPool) {
    if (DB_CONNECTION_STRING) {
      pgPool = new Pool({
        connectionString: DB_CONNECTION_STRING,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      })
    } else if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
      pgPool = new Pool({
        host: DB_HOST,
        port: parseInt(DB_PORT || '5432'),
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      })
    } else {
      throw new Error('PostgreSQL configuration is incomplete. Provide either DATABASE_URL or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD')
    }
  }
  return pgPool
}

// Database initialization
export async function initializeDatabase(): Promise<void> {
  try {
    if (DB_TYPE === 'firestore') {
      const db = getFirestore()
      // Test connection
      await db.collection('_test').limit(1).get()
      console.log('✅ Firestore connection established')
    } else if (DB_TYPE === 'postgres') {
      const pool = getPostgresPool()
      // Test connection
      await pool.query('SELECT 1')
      console.log('✅ PostgreSQL connection established')
      
      // Create tables if they don't exist
      await createTablesIfNotExist()
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// PostgreSQL table creation
async function createTablesIfNotExist(): Promise<void> {
  const pool = getPostgresPool()
  
  const tables = [
    // Vehicles table
    `CREATE TABLE IF NOT EXISTS vehicles (
      id VARCHAR(255) PRIMARY KEY,
      label VARCHAR(255) NOT NULL,
      vin VARCHAR(17),
      plate VARCHAR(20),
      make VARCHAR(100),
      model VARCHAR(100),
      year INTEGER,
      notes TEXT,
      initial_odometer INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Drivers table
    `CREATE TABLE IF NOT EXISTS drivers (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255),
      notes TEXT,
      assigned_vehicle_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Assignments table
    `CREATE TABLE IF NOT EXISTS assignments (
      id VARCHAR(255) PRIMARY KEY,
      vehicle_id VARCHAR(255) NOT NULL,
      driver_id VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      job VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Maintenance records table
    `CREATE TABLE IF NOT EXISTS maintenance_records (
      id VARCHAR(255) PRIMARY KEY,
      vehicle_id VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      odometer INTEGER,
      type VARCHAR(100),
      cost_cents INTEGER,
      vendor VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Odometer logs table
    `CREATE TABLE IF NOT EXISTS odometer_logs (
      id VARCHAR(255) PRIMARY KEY,
      vehicle_id VARCHAR(255) NOT NULL,
      driver_id VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      odometer INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Receipts table
    `CREATE TABLE IF NOT EXISTS receipts (
      id VARCHAR(255) PRIMARY KEY,
      vehicle_id VARCHAR(255) NOT NULL,
      driver_id VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      service_type VARCHAR(50),
      amount_cents INTEGER,
      notes TEXT,
      images TEXT[], -- Array of image URLs/data URLs
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Cleanliness logs table
    `CREATE TABLE IF NOT EXISTS cleanliness_logs (
      id VARCHAR(255) PRIMARY KEY,
      vehicle_id VARCHAR(255) NOT NULL,
      driver_id VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      exterior_images TEXT[], -- Array of image URLs/data URLs
      interior_images TEXT[], -- Array of image URLs/data URLs
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ]
  
  for (const tableSQL of tables) {
    await pool.query(tableSQL)
  }
  
  console.log('✅ Database tables created/verified')
}

// Cleanup function
export async function closeDatabaseConnections(): Promise<void> {
  if (pgPool) {
    await pgPool.end()
    pgPool = null
    console.log('✅ PostgreSQL connections closed')
  }
}

// Get current database type
export function getDatabaseType(): string {
  return DB_TYPE
}
