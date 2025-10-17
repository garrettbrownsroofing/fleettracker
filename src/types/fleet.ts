export type Vehicle = {
  id: string
  label: string // human-friendly name like "Truck 12"
  vin?: string
  plate?: string
  make?: string
  model?: string
  year?: number
  notes?: string
}

export type Driver = {
  id: string
  name: string
  phone?: string
  email?: string
  notes?: string
}

export type Assignment = {
  id: string
  vehicleId: string
  driverId: string
  startDate: string // ISO date
  endDate?: string // ISO date
  job?: string
  notes?: string
}

export type MaintenanceRecord = {
  id: string
  vehicleId: string
  date: string // ISO date
  odometer?: number
  type?: string // e.g., Oil Change, Tires, Inspection
  costCents?: number
  vendor?: string
  notes?: string
}

export type ServiceType =
  | 'Oil Change'
  | 'Tire Rotation'
  | 'Fluid Check'
  | 'Brake Inspection'
  | 'Filter Replacement'
  | 'Major Inspection'

export type OdometerLog = {
  id: string
  vehicleId: string
  driverId: string
  date: string // ISO date
  odometer: number
}


