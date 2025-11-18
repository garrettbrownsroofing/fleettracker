import { NextRequest, NextResponse } from 'next/server'
import {
  vehicleService,
  driverService,
  assignmentService,
  maintenanceService,
  odometerLogService,
  receiptService,
  weeklyCheckService
} from '@/lib/db-service'
import type {
  Vehicle,
  Driver,
  Assignment,
  MaintenanceRecord,
  OdometerLog,
  Receipt,
  WeeklyCheck
} from '@/types/fleet'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to format dates
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Helper function to format currency
function formatCurrency(cents: number | undefined): string {
  if (!cents) return '$0.00'
  return `$${(cents / 100).toFixed(2)}`
}

// Get date 7 days ago
function getSevenDaysAgo(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  date.setHours(0, 0, 0, 0)
  return date
}

// Generate HTML email content
function generateHTMLReport(
  reportDate: string,
  summary: {
    totalVehicles: number
    totalDrivers: number
    activeAssignments: number
    recentMaintenance: number
    recentOdometerLogs: number
    recentWeeklyChecks: number
    recentReceipts: number
  },
  vehicles: Vehicle[],
  drivers: Driver[],
  assignments: Assignment[],
  recentMaintenance: MaintenanceRecord[],
  recentOdometerLogs: OdometerLog[],
  recentWeeklyChecks: WeeklyCheck[],
  recentReceipts: Receipt[]
): string {
  const vehicleRows = vehicles.map(vehicle => {
    const odometer = vehicle.currentOdometer || vehicle.initialOdometer || 0
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle.label || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle.vin || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle.plate || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle.make || ''} ${vehicle.model || ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle.year || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${odometer.toLocaleString()}</td>
      </tr>
    `
  }).join('')

  const assignmentRows = assignments
    .filter(a => !a.endDate || new Date(a.endDate) >= new Date())
    .map(assignment => {
      const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
      const driver = drivers.find(d => d.id === assignment.driverId)
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle?.label || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${driver?.name || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(assignment.startDate)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${assignment.endDate ? formatDate(assignment.endDate) : 'Active'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${assignment.job || 'N/A'}</td>
        </tr>
      `
    }).join('')

  const maintenanceRows = recentMaintenance.map(maint => {
    const vehicle = vehicles.find(v => v.id === maint.vehicleId)
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle?.label || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(maint.date)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${maint.type || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${maint.odometer?.toLocaleString() || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatCurrency(maint.costCents)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${maint.vendor || 'N/A'}</td>
      </tr>
    `
  }).join('')

  const odometerRows = recentOdometerLogs.map(log => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId)
    const driver = drivers.find(d => d.id === log.driverId)
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle?.label || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${driver?.name || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(log.date)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.odometer.toLocaleString()}</td>
      </tr>
    `
  }).join('')

  const weeklyCheckRows = recentWeeklyChecks.map(check => {
    const vehicle = vehicles.find(v => v.id === check.vehicleId)
    const driver = drivers.find(d => d.id === check.driverId)
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle?.label || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${driver?.name || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(check.date)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${check.odometer.toLocaleString()}</td>
      </tr>
    `
  }).join('')

  const receiptRows = recentReceipts.map(receipt => {
    const vehicle = vehicles.find(v => v.id === receipt.vehicleId)
    const driver = drivers.find(d => d.id === receipt.driverId)
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vehicle?.label || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${driver?.name || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(receipt.date)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${receipt.serviceType || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatCurrency(receipt.amountCents)}</td>
      </tr>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a202c; border-bottom: 3px solid #4299e1; padding-bottom: 10px; }
    h2 { color: #2d3748; margin-top: 30px; border-bottom: 2px solid #cbd5e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background-color: #4299e1; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    .summary-box { background-color: #f7fafc; border: 2px solid #cbd5e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px; }
    .summary-item { text-align: center; }
    .summary-value { font-size: 24px; font-weight: bold; color: #4299e1; }
    .summary-label { font-size: 14px; color: #718096; margin-top: 5px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #cbd5e0; color: #718096; font-size: 12px; text-align: center; }
    .no-data { color: #a0aec0; font-style: italic; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Brown's Fleet Tracker - Weekly Backup Report</h1>
    <p><strong>Report Date:</strong> ${reportDate}</p>
    
    <div class="summary-box">
      <h2 style="margin-top: 0;">Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value">${summary.totalVehicles}</div>
          <div class="summary-label">Total Vehicles</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${summary.totalDrivers}</div>
          <div class="summary-label">Total Drivers</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${summary.activeAssignments}</div>
          <div class="summary-label">Active Assignments</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${summary.recentMaintenance}</div>
          <div class="summary-label">Recent Maintenance</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${summary.recentOdometerLogs}</div>
          <div class="summary-label">Recent Odometer Logs</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${summary.recentWeeklyChecks}</div>
          <div class="summary-label">Recent Weekly Checks</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${summary.recentReceipts}</div>
          <div class="summary-label">Recent Receipts</div>
        </div>
      </div>
    </div>

    <h2>All Vehicles</h2>
    ${vehicles.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>VIN</th>
            <th>Plate</th>
            <th>Make/Model</th>
            <th>Year</th>
            <th>Odometer</th>
          </tr>
        </thead>
        <tbody>
          ${vehicleRows}
        </tbody>
      </table>
    ` : '<p class="no-data">No vehicles found</p>'}

    <h2>Active Assignments</h2>
    ${assignments.filter(a => !a.endDate || new Date(a.endDate) >= new Date()).length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Job</th>
          </tr>
        </thead>
        <tbody>
          ${assignmentRows}
        </tbody>
      </table>
    ` : '<p class="no-data">No active assignments</p>'}

    <h2>Recent Activity (Last 7 Days)</h2>

    <h3>Maintenance Records</h3>
    ${recentMaintenance.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Date</th>
            <th>Type</th>
            <th>Odometer</th>
            <th>Cost</th>
            <th>Vendor</th>
          </tr>
        </thead>
        <tbody>
          ${maintenanceRows}
        </tbody>
      </table>
    ` : '<p class="no-data">No maintenance records in the last 7 days</p>'}

    <h3>Odometer Logs</h3>
    ${recentOdometerLogs.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Date</th>
            <th>Odometer</th>
          </tr>
        </thead>
        <tbody>
          ${odometerRows}
        </tbody>
      </table>
    ` : '<p class="no-data">No odometer logs in the last 7 days</p>'}

    <h3>Weekly Checks</h3>
    ${recentWeeklyChecks.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Date</th>
            <th>Odometer</th>
          </tr>
        </thead>
        <tbody>
          ${weeklyCheckRows}
        </tbody>
      </table>
    ` : '<p class="no-data">No weekly checks in the last 7 days</p>'}

    <h3>Receipts</h3>
    ${recentReceipts.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Date</th>
            <th>Service Type</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${receiptRows}
        </tbody>
      </table>
    ` : '<p class="no-data">No receipts in the last 7 days</p>'}

    <div class="footer">
      <p>This is an automated weekly backup report from Brown's Fleet Tracker.</p>
      <p>Generated at: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Generate plain text email content
function generateTextReport(
  reportDate: string,
  summary: {
    totalVehicles: number
    totalDrivers: number
    activeAssignments: number
    recentMaintenance: number
    recentOdometerLogs: number
    recentWeeklyChecks: number
    recentReceipts: number
  },
  vehicles: Vehicle[],
  drivers: Driver[],
  assignments: Assignment[],
  recentMaintenance: MaintenanceRecord[],
  recentOdometerLogs: OdometerLog[],
  recentWeeklyChecks: WeeklyCheck[],
  recentReceipts: Receipt[]
): string {
  const lines: string[] = []
  
  lines.push('Brown\'s Fleet Tracker - Weekly Backup Report')
  lines.push('='.repeat(60))
  lines.push(`Report Date: ${reportDate}`)
  lines.push('')
  
  lines.push('SUMMARY')
  lines.push('-'.repeat(60))
  lines.push(`Total Vehicles: ${summary.totalVehicles}`)
  lines.push(`Total Drivers: ${summary.totalDrivers}`)
  lines.push(`Active Assignments: ${summary.activeAssignments}`)
  lines.push(`Recent Maintenance: ${summary.recentMaintenance}`)
  lines.push(`Recent Odometer Logs: ${summary.recentOdometerLogs}`)
  lines.push(`Recent Weekly Checks: ${summary.recentWeeklyChecks}`)
  lines.push(`Recent Receipts: ${summary.recentReceipts}`)
  lines.push('')
  
  lines.push('ALL VEHICLES')
  lines.push('-'.repeat(60))
  if (vehicles.length > 0) {
    vehicles.forEach(vehicle => {
      const odometer = vehicle.currentOdometer || vehicle.initialOdometer || 0
      lines.push(`${vehicle.label || 'N/A'} | VIN: ${vehicle.vin || 'N/A'} | Plate: ${vehicle.plate || 'N/A'} | ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.year || ''} | Odometer: ${odometer.toLocaleString()}`)
    })
  } else {
    lines.push('No vehicles found')
  }
  lines.push('')
  
  lines.push('ACTIVE ASSIGNMENTS')
  lines.push('-'.repeat(60))
  const activeAssignments = assignments.filter(a => !a.endDate || new Date(a.endDate) >= new Date())
  if (activeAssignments.length > 0) {
    activeAssignments.forEach(assignment => {
      const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
      const driver = drivers.find(d => d.id === assignment.driverId)
      lines.push(`${vehicle?.label || 'N/A'} → ${driver?.name || 'N/A'} | Start: ${formatDate(assignment.startDate)} | End: ${assignment.endDate ? formatDate(assignment.endDate) : 'Active'} | Job: ${assignment.job || 'N/A'}`)
    })
  } else {
    lines.push('No active assignments')
  }
  lines.push('')
  
  lines.push('RECENT ACTIVITY (Last 7 Days)')
  lines.push('='.repeat(60))
  
  lines.push('')
  lines.push('Maintenance Records')
  lines.push('-'.repeat(60))
  if (recentMaintenance.length > 0) {
    recentMaintenance.forEach(maint => {
      const vehicle = vehicles.find(v => v.id === maint.vehicleId)
      lines.push(`${formatDate(maint.date)} | ${vehicle?.label || 'N/A'} | ${maint.type || 'N/A'} | Odometer: ${maint.odometer?.toLocaleString() || 'N/A'} | Cost: ${formatCurrency(maint.costCents)} | Vendor: ${maint.vendor || 'N/A'}`)
    })
  } else {
    lines.push('No maintenance records in the last 7 days')
  }
  lines.push('')
  
  lines.push('Odometer Logs')
  lines.push('-'.repeat(60))
  if (recentOdometerLogs.length > 0) {
    recentOdometerLogs.forEach(log => {
      const vehicle = vehicles.find(v => v.id === log.vehicleId)
      const driver = drivers.find(d => d.id === log.driverId)
      lines.push(`${formatDate(log.date)} | ${vehicle?.label || 'N/A'} | ${driver?.name || 'N/A'} | Odometer: ${log.odometer.toLocaleString()}`)
    })
  } else {
    lines.push('No odometer logs in the last 7 days')
  }
  lines.push('')
  
  lines.push('Weekly Checks')
  lines.push('-'.repeat(60))
  if (recentWeeklyChecks.length > 0) {
    recentWeeklyChecks.forEach(check => {
      const vehicle = vehicles.find(v => v.id === check.vehicleId)
      const driver = drivers.find(d => d.id === check.driverId)
      lines.push(`${formatDate(check.date)} | ${vehicle?.label || 'N/A'} | ${driver?.name || 'N/A'} | Odometer: ${check.odometer.toLocaleString()}`)
    })
  } else {
    lines.push('No weekly checks in the last 7 days')
  }
  lines.push('')
  
  lines.push('Receipts')
  lines.push('-'.repeat(60))
  if (recentReceipts.length > 0) {
    recentReceipts.forEach(receipt => {
      const vehicle = vehicles.find(v => v.id === receipt.vehicleId)
      const driver = drivers.find(d => d.id === receipt.driverId)
      lines.push(`${formatDate(receipt.date)} | ${vehicle?.label || 'N/A'} | ${driver?.name || 'N/A'} | ${receipt.serviceType || 'N/A'} | ${formatCurrency(receipt.amountCents)}`)
    })
  } else {
    lines.push('No receipts in the last 7 days')
  }
  lines.push('')
  lines.push('-'.repeat(60))
  lines.push('This is an automated weekly backup report from Brown\'s Fleet Tracker.')
  lines.push(`Generated at: ${new Date().toISOString()}`)
  
  return lines.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    // Validate webhook URL is set
    const webhookUrl = process.env.ZAPIER_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('❌ ZAPIER_WEBHOOK_URL is not set')
      return NextResponse.json(
        { error: 'ZAPIER_WEBHOOK_URL environment variable is not configured' },
        { status: 500 }
      )
    }

    console.log('📊 Generating weekly report...')
    const startTime = Date.now()

    // Fetch all data in parallel
    const [
      vehicles,
      drivers,
      assignments,
      allMaintenance,
      allOdometerLogs,
      allReceipts,
      allWeeklyChecks
    ] = await Promise.all([
      vehicleService.getAll(),
      driverService.getAll(),
      assignmentService.getAll(),
      maintenanceService.getAll(),
      odometerLogService.getAll(),
      receiptService.getAll(),
      weeklyCheckService.getAll()
    ])

    console.log(`✅ Fetched data: ${vehicles.length} vehicles, ${drivers.length} drivers, ${assignments.length} assignments`)

    // Filter recent activity (last 7 days)
    const sevenDaysAgo = getSevenDaysAgo()
    
    const recentMaintenance = allMaintenance.filter(m => 
      new Date(m.date) >= sevenDaysAgo
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const recentOdometerLogs = allOdometerLogs.filter(log => 
      new Date(log.date) >= sevenDaysAgo
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const recentWeeklyChecks = allWeeklyChecks.filter(check => 
      new Date(check.date) >= sevenDaysAgo
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const recentReceipts = allReceipts.filter(receipt => 
      new Date(receipt.date) >= sevenDaysAgo
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Count active assignments
    const activeAssignments = assignments.filter(a => 
      !a.endDate || new Date(a.endDate) >= new Date()
    )

    // Generate summary
    const summary = {
      totalVehicles: vehicles.length,
      totalDrivers: drivers.length,
      activeAssignments: activeAssignments.length,
      recentMaintenance: recentMaintenance.length,
      recentOdometerLogs: recentOdometerLogs.length,
      recentWeeklyChecks: recentWeeklyChecks.length,
      recentReceipts: recentReceipts.length
    }

    // Format report date
    const reportDate = formatDate(new Date())
    const generatedAt = new Date().toISOString()

    // Generate HTML and text content
    const htmlContent = generateHTMLReport(
      reportDate,
      summary,
      vehicles,
      drivers,
      assignments,
      recentMaintenance,
      recentOdometerLogs,
      recentWeeklyChecks,
      recentReceipts
    )

    const textContent = generateTextReport(
      reportDate,
      summary,
      vehicles,
      drivers,
      assignments,
      recentMaintenance,
      recentOdometerLogs,
      recentWeeklyChecks,
      recentReceipts
    )

    // Prepare payload for Zapier
    const payload = {
      reportDate,
      generatedAt,
      summary,
      htmlContent,
      textContent,
      data: {
        vehicles,
        drivers,
        assignments,
        recentMaintenance,
        recentOdometerLogs,
        recentWeeklyChecks,
        recentReceipts
      }
    }

    // Send to Zapier webhook
    console.log(`📤 Sending report to Zapier webhook...`)
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error(`❌ Zapier webhook error: ${webhookResponse.status} - ${errorText}`)
      return NextResponse.json(
        {
          error: 'Failed to send report to Zapier webhook',
          status: webhookResponse.status,
          details: errorText
        },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    console.log(`✅ Weekly report generated and sent successfully in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'Weekly report generated and sent successfully',
      reportDate,
      generatedAt,
      summary,
      duration: `${duration}ms`
    })
  } catch (error) {
    console.error('❌ Error generating weekly report:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      {
        error: 'Failed to generate weekly report',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}
