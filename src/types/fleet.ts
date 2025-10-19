export type Vehicle = {
  id: string
  label: string // human-friendly name like "Truck 12"
  vin?: string
  plate?: string
  make?: string
  model?: string
  year?: number
  notes?: string
  initialOdometer?: number
}

export type Driver = {
  id: string
  name: string
  phone?: string
  email?: string
  notes?: string
  assignedVehicleId?: string // For form state when adding driver with vehicle assignment
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
  receiptImages?: string[] // data URLs for receipt images
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

export type Receipt = {
  id: string
  vehicleId: string
  driverId: string
  date: string // ISO date
  serviceType?: ServiceType
  amountCents?: number
  notes?: string
  images: string[] // data URLs
}

export type CleanlinessLog = {
  id: string
  vehicleId: string
  driverId: string
  date: string // ISO date (Friday)
  exteriorImages: string[] // data URLs
  interiorImages: string[] // data URLs
  notes?: string
}

export type WeeklyCheck = {
  id: string
  vehicleId: string
  driverId: string
  date: string // ISO date (Friday)
  odometer: number
  odometerPhoto: string // data URL for odometer photo
  exteriorImages: string[] // data URLs for exterior photos
  interiorImages: string[] // data URLs for interior photos
  notes?: string
  submittedAt: string // ISO timestamp
}


