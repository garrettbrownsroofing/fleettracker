// Database service layer for CRUD operations
import { getFirestore } from './database'
import { getDatabaseType } from './database'
import { storage } from './simple-storage'
import type { Vehicle, Driver, Assignment, MaintenanceRecord, OdometerLog, Receipt, CleanlinessLog } from '@/types/fleet'

const DB_TYPE = getDatabaseType()

// Generic CRUD operations for Firestore
class FirestoreService {
  private db = getFirestore()

  async create<T>(collection: string, id: string, data: T): Promise<T> {
    await this.db.collection(collection).doc(id).set(data)
    return data
  }

  async read<T>(collection: string, id?: string): Promise<T[]> {
    if (id) {
      const doc = await this.db.collection(collection).doc(id).get()
      return doc.exists ? [doc.data() as T] : []
    }
    const snapshot = await this.db.collection(collection).get()
    return snapshot.docs.map(doc => doc.data() as T)
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    await this.db.collection(collection).doc(id).update(data)
    const updated = await this.db.collection(collection).doc(id).get()
    return updated.data() as T
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete()
  }
}

// PostgreSQL service removed - using Firestore only

// Service instances
const firestoreService = new FirestoreService()

// Vehicle operations
export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.read<Vehicle>('vehicles')
      } else {
        // Fallback to simple storage
        return await storage.load('vehicles')
      }
    } catch (error) {
      console.error('Error in vehicleService.getAll, falling back to simple storage:', error)
      return await storage.load('vehicles')
    }
  },

  async getById(id: string): Promise<Vehicle | null> {
    try {
      if (DB_TYPE === 'firestore') {
        const results = await firestoreService.read<Vehicle>('vehicles', id)
        return results[0] || null
      } else {
        const vehicles = await storage.load('vehicles')
        return vehicles.find(v => v.id === id) || null
      }
    } catch (error) {
      console.error('Error in vehicleService.getById, falling back to simple storage:', error)
      const vehicles = await storage.load('vehicles')
      return vehicles.find(v => v.id === id) || null
    }
  },

  async create(vehicle: Vehicle): Promise<Vehicle> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.create<Vehicle>('vehicles', vehicle.id, vehicle)
      } else {
        return await storage.create('vehicles', vehicle)
      }
    } catch (error) {
      console.error('Error in vehicleService.create, falling back to simple storage:', error)
      return await storage.create('vehicles', vehicle)
    }
  },

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.update<Vehicle>('vehicles', id, vehicle)
      } else {
        return await storage.update('vehicles', id, vehicle)
      }
    } catch (error) {
      console.error('Error in vehicleService.update, falling back to simple storage:', error)
      return await storage.update('vehicles', id, vehicle)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.delete('vehicles', id)
      } else {
        return await storage.delete('vehicles', id)
      }
    } catch (error) {
      console.error('Error in vehicleService.delete, falling back to simple storage:', error)
      return await storage.delete('vehicles', id)
    }
  }
}

// Driver operations
export const driverService = {
  async getAll(): Promise<Driver[]> {
    return DB_TYPE === 'firestore' 
      ? await firestoreService.read<Driver>('drivers')
      : await postgresService.read<Driver>('drivers')
  },

  async getById(id: string): Promise<Driver | null> {
    const results = DB_TYPE === 'firestore'
      ? await firestoreService.read<Driver>('drivers', id)
      : await postgresService.read<Driver>('drivers', id)
    return results[0] || null
  },

  async create(driver: Driver): Promise<Driver> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.create<Driver>('drivers', driver.id, driver)
      : await postgresService.create<Driver>('drivers', driver)
  },

  async update(id: string, driver: Partial<Driver>): Promise<Driver> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.update<Driver>('drivers', id, driver)
      : await postgresService.update<Driver>('drivers', id, driver)
  },

  async delete(id: string): Promise<void> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.delete('drivers', id)
      : await postgresService.delete('drivers', id)
  }
}

// Assignment operations
export const assignmentService = {
  async getAll(): Promise<Assignment[]> {
    return DB_TYPE === 'firestore' 
      ? await firestoreService.read<Assignment>('assignments')
      : await postgresService.read<Assignment>('assignments')
  },

  async getById(id: string): Promise<Assignment | null> {
    const results = DB_TYPE === 'firestore'
      ? await firestoreService.read<Assignment>('assignments', id)
      : await postgresService.read<Assignment>('assignments', id)
    return results[0] || null
  },

  async create(assignment: Assignment): Promise<Assignment> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.create<Assignment>('assignments', assignment.id, assignment)
      : await postgresService.create<Assignment>('assignments', assignment)
  },

  async update(id: string, assignment: Partial<Assignment>): Promise<Assignment> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.update<Assignment>('assignments', id, assignment)
      : await postgresService.update<Assignment>('assignments', id, assignment)
  },

  async delete(id: string): Promise<void> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.delete('assignments', id)
      : await postgresService.delete('assignments', id)
  }
}

// Maintenance operations
export const maintenanceService = {
  async getAll(): Promise<MaintenanceRecord[]> {
    return DB_TYPE === 'firestore' 
      ? await firestoreService.read<MaintenanceRecord>('maintenance_records')
      : await postgresService.read<MaintenanceRecord>('maintenance_records')
  },

  async getById(id: string): Promise<MaintenanceRecord | null> {
    const results = DB_TYPE === 'firestore'
      ? await firestoreService.read<MaintenanceRecord>('maintenance_records', id)
      : await postgresService.read<MaintenanceRecord>('maintenance_records', id)
    return results[0] || null
  },

  async create(record: MaintenanceRecord): Promise<MaintenanceRecord> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.create<MaintenanceRecord>('maintenance_records', record.id, record)
      : await postgresService.create<MaintenanceRecord>('maintenance_records', record)
  },

  async update(id: string, record: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.update<MaintenanceRecord>('maintenance_records', id, record)
      : await postgresService.update<MaintenanceRecord>('maintenance_records', id, record)
  },

  async delete(id: string): Promise<void> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.delete('maintenance_records', id)
      : await postgresService.delete('maintenance_records', id)
  }
}

// Odometer log operations
export const odometerLogService = {
  async getAll(): Promise<OdometerLog[]> {
    return DB_TYPE === 'firestore' 
      ? await firestoreService.read<OdometerLog>('odometer_logs')
      : await postgresService.read<OdometerLog>('odometer_logs')
  },

  async getById(id: string): Promise<OdometerLog | null> {
    const results = DB_TYPE === 'firestore'
      ? await firestoreService.read<OdometerLog>('odometer_logs', id)
      : await postgresService.read<OdometerLog>('odometer_logs', id)
    return results[0] || null
  },

  async create(log: OdometerLog): Promise<OdometerLog> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.create<OdometerLog>('odometer_logs', log.id, log)
      : await postgresService.create<OdometerLog>('odometer_logs', log)
  },

  async update(id: string, log: Partial<OdometerLog>): Promise<OdometerLog> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.update<OdometerLog>('odometer_logs', id, log)
      : await postgresService.update<OdometerLog>('odometer_logs', id, log)
  },

  async delete(id: string): Promise<void> {
    return DB_TYPE === 'firestore'
      ? await firestoreService.delete('odometer_logs', id)
      : await postgresService.delete('odometer_logs', id)
  }
}
