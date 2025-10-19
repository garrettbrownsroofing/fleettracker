// Database service layer for CRUD operations
import { getFirestore } from './database'
import { getDatabaseType } from './database'
import { storage } from './simple-storage'
import type { Vehicle, Driver, Assignment, MaintenanceRecord, OdometerLog, Receipt, CleanlinessLog, WeeklyCheck } from '@/types/fleet'
import type { DocumentData } from '@google-cloud/firestore'

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
      return doc.exists ? [{ id: doc.id, ...(doc.data() as T) } as T] : []
    }
    const snapshot = await this.db.collection(collection).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as T) } as T))
  }

  async update<T extends DocumentData>(collection: string, id: string, data: Partial<T>): Promise<T> {
    await this.db.collection(collection).doc(id).update(data)
    const updated = await this.db.collection(collection).doc(id).get()
    return { id: updated.id, ...(updated.data() as T) } as T
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
      if (getDatabaseType() === 'firestore') {
        console.log('🔍 Fetching vehicles from Firestore...')
        const vehicles = await firestoreService.read<Vehicle>('vehicles')
        console.log('✅ Firestore vehicles:', vehicles.length, 'items')
        return vehicles
      } else {
        console.log('🔍 Fetching vehicles from simple storage...')
        const vehicles = await storage.load('vehicles')
        console.log('✅ Simple storage vehicles:', vehicles.length, 'items')
        return vehicles
      }
    } catch (error) {
      console.error('❌ Error in vehicleService.getAll, falling back to simple storage:', error)
      const vehicles = await storage.load('vehicles')
      console.log('✅ Fallback vehicles:', vehicles.length, 'items')
      return vehicles
    }
  },

  async getById(id: string): Promise<Vehicle | null> {
    try {
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
        console.log('💾 Creating vehicle in Firestore:', vehicle.id, vehicle.label)
        const result = await firestoreService.create<Vehicle>('vehicles', vehicle.id, vehicle)
        console.log('✅ Firestore create result:', result)
        return result
      } else {
        console.log('💾 Creating vehicle in simple storage:', vehicle.id, vehicle.label)
        const result = await storage.create('vehicles', vehicle)
        console.log('✅ Simple storage create result:', result)
        return result
      }
    } catch (error) {
      console.error('❌ Error in vehicleService.create, falling back to simple storage:', error)
      const result = await storage.create('vehicles', vehicle)
      console.log('✅ Fallback create result:', result)
      return result
    }
  },

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    try {
      if (getDatabaseType() === 'firestore') {
        console.log('✏️ Updating vehicle in Firestore:', id, vehicle.label)
        const result = await firestoreService.update<Vehicle>('vehicles', id, vehicle)
        console.log('✅ Firestore update result:', result)
        return result
      } else {
        console.log('✏️ Updating vehicle in simple storage:', id, vehicle.label)
        const result = await storage.update('vehicles', id, vehicle)
        console.log('✅ Simple storage update result:', result)
        return result
      }
    } catch (error) {
      console.error('❌ Error in vehicleService.update, falling back to simple storage:', error)
      const result = await storage.update('vehicles', id, vehicle)
      console.log('✅ Fallback update result:', result)
      return result
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (getDatabaseType() === 'firestore') {
        console.log('🗑️ Deleting vehicle from Firestore:', id)
        await firestoreService.delete('vehicles', id)
        console.log('✅ Firestore delete completed')
      } else {
        console.log('🗑️ Deleting vehicle from simple storage:', id)
        await storage.delete('vehicles', id)
        console.log('✅ Simple storage delete completed')
      }
    } catch (error) {
      console.error('❌ Error in vehicleService.delete, falling back to simple storage:', error)
      await storage.delete('vehicles', id)
      console.log('✅ Fallback delete completed')
    }
  }
}

// Driver operations
export const driverService = {
  async getAll(): Promise<Driver[]> {
    try {
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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

// Receipt operations
export const receiptService = {
  async getAll(): Promise<Receipt[]> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.read<Receipt>('receipts')
      } else {
        // Fallback to simple storage
        return await storage.load('receipts')
      }
    } catch (error) {
      console.error('Error in receiptService.getAll, falling back to simple storage:', error)
      return await storage.load('receipts')
    }
  },

  async getById(id: string): Promise<Receipt | null> {
    try {
      if (getDatabaseType() === 'firestore') {
        const results = await firestoreService.read<Receipt>('receipts', id)
        return results[0] || null
      } else {
        const receipts = await storage.load('receipts')
        return receipts.find(r => r.id === id) || null
      }
    } catch (error) {
      console.error('Error in receiptService.getById, falling back to simple storage:', error)
      const receipts = await storage.load('receipts')
      return receipts.find(r => r.id === id) || null
    }
  },

  async create(receipt: Receipt): Promise<Receipt> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.create<Receipt>('receipts', receipt.id, receipt)
      } else {
        return await storage.create('receipts', receipt)
      }
    } catch (error) {
      console.error('Error in receiptService.create, falling back to simple storage:', error)
      return await storage.create('receipts', receipt)
    }
  },

  async update(id: string, receipt: Partial<Receipt>): Promise<Receipt> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.update<Receipt>('receipts', id, receipt)
      } else {
        return await storage.update('receipts', id, receipt)
      }
    } catch (error) {
      console.error('Error in receiptService.update, falling back to simple storage:', error)
      return await storage.update('receipts', id, receipt)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.delete('receipts', id)
      } else {
        return await storage.delete('receipts', id)
      }
    } catch (error) {
      console.error('Error in receiptService.delete, falling back to simple storage:', error)
      return await storage.delete('receipts', id)
    }
  }
}

// Cleanliness log operations
export const cleanlinessService = {
  async getAll(): Promise<CleanlinessLog[]> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.read<CleanlinessLog>('cleanliness_logs')
      } else {
        // Fallback to simple storage
        return await storage.load('cleanliness_logs')
      }
    } catch (error) {
      console.error('Error in cleanlinessService.getAll, falling back to simple storage:', error)
      return await storage.load('cleanliness_logs')
    }
  },

  async getById(id: string): Promise<CleanlinessLog | null> {
    try {
      if (getDatabaseType() === 'firestore') {
        const results = await firestoreService.read<CleanlinessLog>('cleanliness_logs', id)
        return results[0] || null
      } else {
        const logs = await storage.load('cleanliness_logs')
        return logs.find(l => l.id === id) || null
      }
    } catch (error) {
      console.error('Error in cleanlinessService.getById, falling back to simple storage:', error)
      const logs = await storage.load('cleanliness_logs')
      return logs.find(l => l.id === id) || null
    }
  },

  async create(log: CleanlinessLog): Promise<CleanlinessLog> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.create<CleanlinessLog>('cleanliness_logs', log.id, log)
      } else {
        return await storage.create('cleanliness_logs', log)
      }
    } catch (error) {
      console.error('Error in cleanlinessService.create, falling back to simple storage:', error)
      return await storage.create('cleanliness_logs', log)
    }
  },

  async update(id: string, log: Partial<CleanlinessLog>): Promise<CleanlinessLog> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.update<CleanlinessLog>('cleanliness_logs', id, log)
      } else {
        return await storage.update('cleanliness_logs', id, log)
      }
    } catch (error) {
      console.error('Error in cleanlinessService.update, falling back to simple storage:', error)
      return await storage.update('cleanliness_logs', id, log)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.delete('cleanliness_logs', id)
      } else {
        return await storage.delete('cleanliness_logs', id)
      }
    } catch (error) {
      console.error('Error in cleanlinessService.delete, falling back to simple storage:', error)
      return await storage.delete('cleanliness_logs', id)
    }
  }
}

// Odometer log operations
export const odometerLogService = {
  async getAll(): Promise<OdometerLog[]> {
    try {
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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
      if (getDatabaseType() === 'firestore') {
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

// Weekly check operations
export const weeklyCheckService = {
  async getAll(): Promise<WeeklyCheck[]> {
    try {
      if (getDatabaseType() === 'firestore') {
        console.log('🔍 weeklyCheckService.getAll - Using Firestore')
        const result = await firestoreService.read<WeeklyCheck>('weekly_checks')
        console.log('✅ Firestore weekly checks result:', result.length, 'items')
        return result
      } else {
        console.log('🔍 weeklyCheckService.getAll - Using simple storage')
        // Fallback to simple storage
        const result = await storage.load('weekly_checks')
        console.log('✅ Simple storage weekly checks result:', result.length, 'items')
        return result
      }
    } catch (error) {
      console.error('❌ Error in weeklyCheckService.getAll, falling back to simple storage:', error)
      const result = await storage.load('weekly_checks')
      console.log('✅ Fallback weekly checks result:', result.length, 'items')
      return result
    }
  },

  async getById(id: string): Promise<WeeklyCheck | null> {
    try {
      if (getDatabaseType() === 'firestore') {
        const results = await firestoreService.read<WeeklyCheck>('weekly_checks', id)
        return results[0] || null
      } else {
        const checks = await storage.load('weekly_checks')
        return checks.find(c => c.id === id) || null
      }
    } catch (error) {
      console.error('Error in weeklyCheckService.getById, falling back to simple storage:', error)
      const checks = await storage.load('weekly_checks')
      return checks.find(c => c.id === id) || null
    }
  },

  async create(check: WeeklyCheck): Promise<WeeklyCheck> {
    try {
      if (getDatabaseType() === 'firestore') {
        console.log('💾 weeklyCheckService.create - Using Firestore:', check.id)
        const result = await firestoreService.create<WeeklyCheck>('weekly_checks', check.id, check)
        console.log('✅ Firestore create result:', result)
        return result
      } else {
        console.log('💾 weeklyCheckService.create - Using simple storage:', check.id)
        const result = await storage.create('weekly_checks', check)
        console.log('✅ Simple storage create result:', result)
        return result
      }
    } catch (error) {
      console.error('❌ Error in weeklyCheckService.create, falling back to simple storage:', error)
      const result = await storage.create('weekly_checks', check)
      console.log('✅ Fallback create result:', result)
      return result
    }
  },

  async update(id: string, check: Partial<WeeklyCheck>): Promise<WeeklyCheck> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.update<WeeklyCheck>('weekly_checks', id, check)
      } else {
        return await storage.update('weekly_checks', id, check)
      }
    } catch (error) {
      console.error('Error in weeklyCheckService.update, falling back to simple storage:', error)
      return await storage.update('weekly_checks', id, check)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (getDatabaseType() === 'firestore') {
        return await firestoreService.delete('weekly_checks', id)
      } else {
        return await storage.delete('weekly_checks', id)
      }
    } catch (error) {
      console.error('Error in weeklyCheckService.delete, falling back to simple storage:', error)
      return await storage.delete('weekly_checks', id)
    }
  }
}
