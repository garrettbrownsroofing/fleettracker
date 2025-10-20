import { useMemo } from 'react'
import type { Vehicle, MaintenanceRecord, WeeklyCheck, Assignment } from '@/types/fleet'
import { computeServiceStatuses, computeLatestOdometer } from './service'

export type NotificationItem = {
  id: string
  type: 'maintenance' | 'weekly-check'
  title: string
  description: string
  vehicleLabel: string
  priority: 'high' | 'medium' | 'low'
  href: '/maintenance' | '/weekly-check' | '/reports'
  dismissed?: boolean
}

export function useNotifications(
  vehicles: Vehicle[],
  maintenance: MaintenanceRecord[],
  weeklyChecks: WeeklyCheck[],
  assignments: Assignment[],
  role: string,
  userId?: string,
  dismissedNotifications: Set<string> = new Set()
) {
  const notifications = useMemo(() => {
    const items: NotificationItem[] = []
    
    // Get visible vehicles based on role
    const visibleVehicleIds = role === 'admin' 
      ? new Set(vehicles.map(v => v.id))
      : new Set(assignments.filter(a => a.driverId === userId).map(a => a.vehicleId))
    
    const visibleVehicles = vehicles.filter(v => visibleVehicleIds.has(v.id))
    
    // Check for overdue maintenance
    visibleVehicles.forEach(vehicle => {
      const serviceStatuses = computeServiceStatuses(
        vehicle.id, 
        [], // odometer logs not needed for this calculation
        maintenance, 
        vehicles, 
        250, // warning threshold
        weeklyChecks
      )
      
      const overdueServices = serviceStatuses.filter(s => s.status === 'overdue')
      const warningServices = serviceStatuses.filter(s => s.status === 'warning')
      
      if (overdueServices.length > 0) {
        items.push({
          id: `maintenance-overdue-${vehicle.id}`,
          type: 'maintenance',
          title: `${overdueServices.length} Overdue Maintenance`,
          description: overdueServices.map(s => s.service).join(', '),
          vehicleLabel: vehicle.label,
          priority: 'high',
          href: '/maintenance'
        })
      } else if (warningServices.length > 0) {
        items.push({
          id: `maintenance-warning-${vehicle.id}`,
          type: 'maintenance',
          title: `${warningServices.length} Maintenance Due Soon`,
          description: warningServices.map(s => s.service).join(', '),
          vehicleLabel: vehicle.label,
          priority: 'medium',
          href: '/maintenance'
        })
      }
    })
    
    // Check for overdue weekly check-ins (8+ days without check)
    const now = new Date()
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
    
    visibleVehicles.forEach(vehicle => {
      const vehicleChecks = weeklyChecks
        .filter(check => check.vehicleId === vehicle.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      const latestCheck = vehicleChecks[0]
      const lastCheckDate = latestCheck ? new Date(latestCheck.date) : null
      
      if (!lastCheckDate || lastCheckDate < eightDaysAgo) {
        const daysOverdue = lastCheckDate 
          ? Math.floor((now.getTime() - lastCheckDate.getTime()) / (24 * 60 * 60 * 1000))
          : null
        
        items.push({
          id: `weekly-check-overdue-${vehicle.id}`,
          type: 'weekly-check',
          title: 'Overdue Weekly Check',
          description: daysOverdue 
            ? `${daysOverdue} days overdue` 
            : 'Never checked in',
          vehicleLabel: vehicle.label,
          priority: 'high',
          href: '/weekly-check'
        })
      }
    })
    
    // Filter out dismissed notifications
    const activeNotifications = items.filter(item => !dismissedNotifications.has(item.id))
    
    // Sort by priority (high first) then by type
    return activeNotifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      const typeOrder = { 'weekly-check': 0, maintenance: 1 }
      return typeOrder[a.type] - typeOrder[b.type]
    })
  }, [vehicles, maintenance, weeklyChecks, assignments, role, userId, dismissedNotifications])
  
  const notificationCount = notifications.length
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length
  
  return {
    notifications,
    notificationCount,
    highPriorityCount
  }
}
