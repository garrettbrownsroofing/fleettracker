import type { MaintenanceRecord, OdometerLog, ServiceType, Vehicle } from '@/types/fleet'

export const SERVICE_INTERVALS_MILES: Record<ServiceType, number> = {
  'Oil Change': 5000,
  'Tire Rotation': 5000,
  'Fluid Check': 5000,
  'Brake Inspection': 5000,
  'Filter Replacement': 20000,
  'Major Inspection': 30000,
}

export type ServiceStatus = {
  service: ServiceType
  milesSince: number
  milesUntilDue: number
  status: 'ok' | 'warning' | 'overdue'
}

export function computeLatestOdometer(
  vehicleId: string,
  odometerLogs: OdometerLog[],
  maintenance: MaintenanceRecord[],
  vehicles: Vehicle[]
): number | null {
  const latestLog = odometerLogs
    .filter(l => l.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  const latestMaintOdo = maintenance
    .filter(m => m.vehicleId === vehicleId && typeof m.odometer === 'number')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.odometer
  
  // Only use reported readings, not initial odometer
  const odo = latestLog?.odometer ?? latestMaintOdo ?? null
  return typeof odo === 'number' ? odo : null
}

export function computeServiceStatuses(
  vehicleId: string,
  odometerLogs: OdometerLog[],
  maintenance: MaintenanceRecord[],
  vehicles: Vehicle[],
  warningThresholdMiles = 250
): ServiceStatus[] {
  const currentOdo = computeLatestOdometer(vehicleId, odometerLogs, maintenance, vehicles)
  if (currentOdo == null) {
    return (Object.keys(SERVICE_INTERVALS_MILES) as ServiceType[]).map(s => ({
      service: s,
      milesSince: 0,
      milesUntilDue: SERVICE_INTERVALS_MILES[s],
      status: 'warning',
    }))
  }

  const lastServiceAt: Partial<Record<ServiceType, number>> = {}
  for (const rec of maintenance) {
    if (rec.vehicleId !== vehicleId) continue
    const service = normalizeRecordToServiceType(rec.type)
    if (!service) continue
    const odo = rec.odometer ?? undefined
    if (odo == null) continue
    const prev = lastServiceAt[service]
    if (prev == null || odo > prev) {
      lastServiceAt[service] = odo
    }
  }

  return (Object.keys(SERVICE_INTERVALS_MILES) as ServiceType[]).map(service => {
    const interval = SERVICE_INTERVALS_MILES[service]
    const lastOdo = lastServiceAt[service] ?? 0
    const milesSince = Math.max(0, currentOdo - lastOdo)
    const milesUntilDue = Math.max(0, interval - milesSince)
    const status: ServiceStatus = milesSince >= interval
      ? { service, milesSince, milesUntilDue: 0, status: 'overdue' }
      : milesUntilDue <= warningThresholdMiles
      ? { service, milesSince, milesUntilDue, status: 'warning' }
      : { service, milesSince, milesUntilDue, status: 'ok' }
    return status
  })
}

export function normalizeRecordToServiceType(type?: string): ServiceType | null {
  if (!type) return null
  const t = type.trim().toLowerCase()
  if (t.includes('oil')) return 'Oil Change'
  if (t.includes('tire')) return 'Tire Rotation'
  if (t.includes('fluid')) return 'Fluid Check'
  if (t.includes('brake')) return 'Brake Inspection'
  if (t.includes('filter')) return 'Filter Replacement'
  if (t.includes('major') || t.includes('tune')) return 'Major Inspection'
  return null
}


