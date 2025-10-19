// Database service layer for CRUD operations
import { getFirestore } from './database'
import { getDatabaseType } from './database'
import { storage } from './simple-storage'
import type { Vehicle, Driver, Assignment, MaintenanceRecord, OdometerLog, Receipt, CleanlinessLog } from '@/types/fleet'
import type { DocumentData } from '@google-cloud/firestore'

const DB_TYPE = getDatabaseType()

// Generic CRUD operations for Firestore
class FirestoreService {
  private db = getFirestore()

  async create<T extends DocumentData>(collection: string, id: string, data: T): Promise<T> {
    await this.db.collection(collection).doc(id).set(data)
    return data
  }

  async read<T extends DocumentData>(collection: string, id?: string): Promise<T[]> {
    if (id) {
      const doc = await this.db.collection(collection).doc(id).get()
      return doc.exists ? [doc.data() as T] : []
    }
    const snapshot = await this.db.collection(collection).get()
    return snapshot.docs.map(doc => doc.data() as T)
  }

  async update<T extends DocumentData>(collection: string, id: string, data: Partial<T>): Promise<T> {
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
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.read<Driver>('drivers')
      } else {
        // Fallback to simple storage
        return await storage.load('drivers')
      }
    } catch (error) {
      console.error('Error in driverService.getAll, falling back to simple storage:', error)
      return await storage.load('drivers')
    }
  },

  async getById(id: string): Promise<Driver | null> {
    try {
      if (DB_TYPE === 'firestore') {
        const results = await firestoreService.read<Driver>('drivers', id)
        return results[0] || null
      } else {
        const drivers = await storage.load('drivers')
        return drivers.find(d => d.id === id) || null
      }
    } catch (error) {
      console.error('Error in driverService.getById, falling back to simple storage:', error)
      const drivers = await storage.load('drivers')
      return drivers.find(d => d.id === id) || null
    }
  },

  async create(driver: Driver): Promise<Driver> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.create<Driver>('drivers', driver.id, driver)
      } else {
        return await storage.create('drivers', driver)
      }
    } catch (error) {
      console.error('Error in driverService.create, falling back to simple storage:', error)
      return await storage.create('drivers', driver)
    }
  },

  async update(id: string, driver: Partial<Driver>): Promise<Driver> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.update<Driver>('drivers', id, driver)
      } else {
        return await storage.update('drivers', id, driver)
      }
    } catch (error) {
      console.error('Error in driverService.update, falling back to simple storage:', error)
      return await storage.update('drivers', id, driver)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.delete('drivers', id)
      } else {
        return await storage.delete('drivers', id)
      }
    } catch (error) {
      console.error('Error in driverService.delete, falling back to simple storage:', error)
      return await storage.delete('drivers', id)
    }
  }
}

// Assignment operations
export const assignmentService = {
  async getAll(): Promise<Assignment[]> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.read<Assignment>('assignments')
      } else {
        // Fallback to simple storage
        return await storage.load('assignments')
      }
    } catch (error) {
      console.error('Error in assignmentService.getAll, falling back to simple storage:', error)
      return await storage.load('assignments')
    }
  },

  async getById(id: string): Promise<Assignment | null> {
    try {
      if (DB_TYPE === 'firestore') {
        const results = await firestoreService.read<Assignment>('assignments', id)
        return results[0] || null
      } else {
        const assignments = await storage.load('assignments')
        return assignments.find(a => a.id === id) || null
      }
    } catch (error) {
      console.error('Error in assignmentService.getById, falling back to simple storage:', error)
      const assignments = await storage.load('assignments')
      return assignments.find(a => a.id === id) || null
    }
  },

  async create(assignment: Assignment): Promise<Assignment> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.create<Assignment>('assignments', assignment.id, assignment)
      } else {
        return await storage.create('assignments', assignment)
      }
    } catch (error) {
      console.error('Error in assignmentService.create, falling back to simple storage:', error)
      return await storage.create('assignments', assignment)
    }
  },

  async update(id: string, assignment: Partial<Assignment>): Promise<Assignment> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.update<Assignment>('assignments', id, assignment)
      } else {
        return await storage.update('assignments', id, assignment)
      }
    } catch (error) {
      console.error('Error in assignmentService.update, falling back to simple storage:', error)
      return await storage.update('assignments', id, assignment)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.delete('assignments', id)
      } else {
        return await storage.delete('assignments', id)
      }
    } catch (error) {
      console.error('Error in assignmentService.delete, falling back to simple storage:', error)
      return await storage.delete('assignments', id)
    }
  }
}

// Maintenance operations
export const maintenanceService = {
  async getAll(): Promise<MaintenanceRecord[]> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.read<MaintenanceRecord>('maintenance_records')
      } else {
        // Fallback to simple storage
        return await storage.load('maintenance_records')
      }
    } catch (error) {
      console.error('Error in maintenanceService.getAll, falling back to simple storage:', error)
      return await storage.load('maintenance_records')
    }
  },

  async getById(id: string): Promise<MaintenanceRecord | null> {
    try {
      if (DB_TYPE === 'firestore') {
        const results = await firestoreService.read<MaintenanceRecord>('maintenance_records', id)
        return results[0] || null
      } else {
        const records = await storage.load('maintenance_records')
        return records.find(r => r.id === id) || null
      }
    } catch (error) {
      console.error('Error in maintenanceService.getById, falling back to simple storage:', error)
      const records = await storage.load('maintenance_records')
      return records.find(r => r.id === id) || null
    }
  },

  async create(record: MaintenanceRecord): Promise<MaintenanceRecord> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.create<MaintenanceRecord>('maintenance_records', record.id, record)
      } else {
        return await storage.create('maintenance_records', record)
      }
    } catch (error) {
      console.error('Error in maintenanceService.create, falling back to simple storage:', error)
      return await storage.create('maintenance_records', record)
    }
  },

  async update(id: string, record: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.update<MaintenanceRecord>('maintenance_records', id, record)
      } else {
        return await storage.update('maintenance_records', id, record)
      }
    } catch (error) {
      console.error('Error in maintenanceService.update, falling back to simple storage:', error)
      return await storage.update('maintenance_records', id, record)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.delete('maintenance_records', id)
      } else {
        return await storage.delete('maintenance_records', id)
      }
    } catch (error) {
      console.error('Error in maintenanceService.delete, falling back to simple storage:', error)
      return await storage.delete('maintenance_records', id)
    }
  }
}

// Odometer log operations
export const odometerLogService = {
  async getAll(): Promise<OdometerLog[]> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.read<OdometerLog>('odometer_logs')
      } else {
        // Fallback to simple storage
        return await storage.load('odometer_logs')
      }
    } catch (error) {
      console.error('Error in odometerLogService.getAll, falling back to simple storage:', error)
      return await storage.load('odometer_logs')
    }
  },

  async getById(id: string): Promise<OdometerLog | null> {
    try {
      if (DB_TYPE === 'firestore') {
        const results = await firestoreService.read<OdometerLog>('odometer_logs', id)
        return results[0] || null
      } else {
        const logs = await storage.load('odometer_logs')
        return logs.find(l => l.id === id) || null
      }
    } catch (error) {
      console.error('Error in odometerLogService.getById, falling back to simple storage:', error)
      const logs = await storage.load('odometer_logs')
      return logs.find(l => l.id === id) || null
    }
  },

  async create(log: OdometerLog): Promise<OdometerLog> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.create<OdometerLog>('odometer_logs', log.id, log)
      } else {
        return await storage.create('odometer_logs', log)
      }
    } catch (error) {
      console.error('Error in odometerLogService.create, falling back to simple storage:', error)
      return await storage.create('odometer_logs', log)
    }
  },

  async update(id: string, log: Partial<OdometerLog>): Promise<OdometerLog> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.update<OdometerLog>('odometer_logs', id, log)
      } else {
        return await storage.update('odometer_logs', id, log)
      }
    } catch (error) {
      console.error('Error in odometerLogService.update, falling back to simple storage:', error)
      return await storage.update('odometer_logs', id, log)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (DB_TYPE === 'firestore') {
        return await firestoreService.delete('odometer_logs', id)
      } else {
        return await storage.delete('odometer_logs', id)
      }
    } catch (error) {
      console.error('Error in odometerLogService.delete, falling back to simple storage:', error)
      return await storage.delete('odometer_logs', id)
    }
  }
}
