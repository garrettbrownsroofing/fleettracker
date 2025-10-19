// Database service layer for CRUD operations - Firestore only for multi-user support
import { getFirestore } from './database'
import { getDatabaseType } from './database'
import type { Vehicle, Driver, Assignment, MaintenanceRecord, OdometerLog, Receipt, CleanlinessLog, WeeklyCheck } from '@/types/fleet'
import type { DocumentData } from '@google-cloud/firestore'

// Generic CRUD operations for Firestore
class FirestoreService {
  private db = getFirestore()

  async create<T extends DocumentData>(collection: string, id: string, data: T): Promise<T> {
    try {
      console.log(`💾 FirestoreService.create - Collection: ${collection}, ID: ${id}`)
      console.log(`💾 Data keys: ${Object.keys(data).join(', ')}`)
      
      await this.db.collection(collection).doc(id).set(data)
      console.log(`✅ FirestoreService.create - Success for ${collection}/${id}`)
      return data
    } catch (error) {
      console.error(`❌ FirestoreService.create - Error for ${collection}/${id}:`, error)
      console.error(`❌ Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        details: (error as any)?.details
      })
      throw error
    }
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

// Vehicle operations - Firestore only for multi-user support
export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    console.log('🔍 Fetching vehicles from Firestore...')
    const vehicles = await firestoreService.read<Vehicle>('vehicles')
    console.log('✅ Firestore vehicles:', vehicles.length, 'items')
    return vehicles
  },

  async getById(id: string): Promise<Vehicle | null> {
    const results = await firestoreService.read<Vehicle>('vehicles', id)
    return results[0] || null
  },

  async create(vehicle: Vehicle): Promise<Vehicle> {
    console.log('💾 Creating vehicle in Firestore:', vehicle.id, vehicle.label)
    const result = await firestoreService.create<Vehicle>('vehicles', vehicle.id, vehicle)
    console.log('✅ Firestore create result:', result)
    return result
  },

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    console.log('✏️ Updating vehicle in Firestore:', id, vehicle.label)
    const result = await firestoreService.update<Vehicle>('vehicles', id, vehicle)
    console.log('✅ Firestore update result:', result)
    return result
  },

  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting vehicle from Firestore:', id)
    await firestoreService.delete('vehicles', id)
    console.log('✅ Firestore delete completed')
  }
}

// Driver operations - Firestore only for multi-user support
export const driverService = {
  async getAll(): Promise<Driver[]> {
    return await firestoreService.read<Driver>('drivers')
  },

  async getById(id: string): Promise<Driver | null> {
    const results = await firestoreService.read<Driver>('drivers', id)
    return results[0] || null
  },

  async create(driver: Driver): Promise<Driver> {
    return await firestoreService.create<Driver>('drivers', driver.id, driver)
  },

  async update(id: string, driver: Partial<Driver>): Promise<Driver> {
    return await firestoreService.update<Driver>('drivers', id, driver)
  },

  async delete(id: string): Promise<void> {
    return await firestoreService.delete('drivers', id)
  }
}

// Assignment operations - Firestore only for multi-user support
export const assignmentService = {
  async getAll(): Promise<Assignment[]> {
    return await firestoreService.read<Assignment>('assignments')
  },

  async getById(id: string): Promise<Assignment | null> {
    const results = await firestoreService.read<Assignment>('assignments', id)
    return results[0] || null
  },

  async create(assignment: Assignment): Promise<Assignment> {
    return await firestoreService.create<Assignment>('assignments', assignment.id, assignment)
  },

  async update(id: string, assignment: Partial<Assignment>): Promise<Assignment> {
    return await firestoreService.update<Assignment>('assignments', id, assignment)
  },

  async delete(id: string): Promise<void> {
    return await firestoreService.delete('assignments', id)
  }
}

// Maintenance operations - Firestore only for multi-user support
export const maintenanceService = {
  async getAll(): Promise<MaintenanceRecord[]> {
    return await firestoreService.read<MaintenanceRecord>('maintenance_records')
  },

  async getById(id: string): Promise<MaintenanceRecord | null> {
    const results = await firestoreService.read<MaintenanceRecord>('maintenance_records', id)
    return results[0] || null
  },

  async create(record: MaintenanceRecord): Promise<MaintenanceRecord> {
    return await firestoreService.create<MaintenanceRecord>('maintenance_records', record.id, record)
  },

  async update(id: string, record: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    return await firestoreService.update<MaintenanceRecord>('maintenance_records', id, record)
  },

  async delete(id: string): Promise<void> {
    return await firestoreService.delete('maintenance_records', id)
  }
}

// Receipt operations - Firestore only for multi-user support
export const receiptService = {
  async getAll(): Promise<Receipt[]> {
    return await firestoreService.read<Receipt>('receipts')
  },

  async getById(id: string): Promise<Receipt | null> {
    const results = await firestoreService.read<Receipt>('receipts', id)
    return results[0] || null
  },

  async create(receipt: Receipt): Promise<Receipt> {
    return await firestoreService.create<Receipt>('receipts', receipt.id, receipt)
  },

  async update(id: string, receipt: Partial<Receipt>): Promise<Receipt> {
    return await firestoreService.update<Receipt>('receipts', id, receipt)
  },

  async delete(id: string): Promise<void> {
    return await firestoreService.delete('receipts', id)
  }
}

// Cleanliness log operations - Firestore only for multi-user support
export const cleanlinessService = {
  async getAll(): Promise<CleanlinessLog[]> {
    return await firestoreService.read<CleanlinessLog>('cleanliness_logs')
  },

  async getById(id: string): Promise<CleanlinessLog | null> {
    const results = await firestoreService.read<CleanlinessLog>('cleanliness_logs', id)
    return results[0] || null
  },

  async create(log: CleanlinessLog): Promise<CleanlinessLog> {
    return await firestoreService.create<CleanlinessLog>('cleanliness_logs', log.id, log)
  },

  async update(id: string, log: Partial<CleanlinessLog>): Promise<CleanlinessLog> {
    return await firestoreService.update<CleanlinessLog>('cleanliness_logs', id, log)
  },

  async delete(id: string): Promise<void> {
    return await firestoreService.delete('cleanliness_logs', id)
  }
}

// Odometer log operations - Firestore only for multi-user support
export const odometerLogService = {
  async getAll(): Promise<OdometerLog[]> {
    return await firestoreService.read<OdometerLog>('odometer_logs')
  },

  async getById(id: string): Promise<OdometerLog | null> {
    const results = await firestoreService.read<OdometerLog>('odometer_logs', id)
    return results[0] || null
  },

  async create(log: OdometerLog): Promise<OdometerLog> {
    return await firestoreService.create<OdometerLog>('odometer_logs', log.id, log)
  },

  async update(id: string, log: Partial<OdometerLog>): Promise<OdometerLog> {
    return await firestoreService.update<OdometerLog>('odometer_logs', id, log)
  },

  async delete(id: string): Promise<void> {
    return await firestoreService.delete('odometer_logs', id)
  }
}

// Weekly check operations - Firestore only for multi-user support
export const weeklyCheckService = {
  async getAll(): Promise<WeeklyCheck[]> {
    console.log('🔍 weeklyCheckService.getAll - Using Firestore')
    console.log('🔍 Firestore collection: weekly_checks')
    const result = await firestoreService.read<WeeklyCheck>('weekly_checks')
    console.log('✅ Firestore weekly checks result:', result.length, 'items')
    console.log('🔍 Firestore result details:', result)
    return result
  },

  async getById(id: string): Promise<WeeklyCheck | null> {
    const results = await firestoreService.read<WeeklyCheck>('weekly_checks', id)
    return results[0] || null
  },

  async create(check: WeeklyCheck): Promise<WeeklyCheck> {
    try {
      console.log('💾 weeklyCheckService.create - Using Firestore:', check.id)
      console.log('💾 WeeklyCheck data structure:', {
        id: check.id,
        vehicleId: check.vehicleId,
        driverId: check.driverId,
        date: check.date,
        odometer: check.odometer,
        hasOdometerPhoto: !!check.odometerPhoto,
        exteriorImagesCount: check.exteriorImages?.length || 0,
        interiorImagesCount: check.interiorImages?.length || 0,
        hasNotes: !!check.notes,
        submittedAt: check.submittedAt
      })
      
      const result = await firestoreService.create<WeeklyCheck>('weekly_checks', check.id, check)
      console.log('✅ Firestore create result:', result)
      return result
    } catch (error) {
      console.error('❌ weeklyCheckService.create - Error:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        details: (error as any)?.details
      })
      throw error
    }
  },

  async update(id: string, check: Partial<WeeklyCheck>): Promise<WeeklyCheck> {
    return await firestoreService.update<WeeklyCheck>('weekly_checks', id, check)
  },

  async delete(id: string): Promise<void> {
    return await firestoreService.delete('weekly_checks', id)
  }
}
