import { NextRequest, NextResponse } from 'next/server'
import type { WeeklyCheck, OdometerLog } from '@/types/fleet'
import { weeklyCheckService, odometerLogService } from '@/lib/db-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const checks = await weeklyCheckService.getAll()
    const res = NextResponse.json(checks)
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  } catch (error) {
    console.error('Error fetching weekly checks:', error)
    return NextResponse.json({ error: 'Failed to read weekly checks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const check: WeeklyCheck = await request.json()
    
    // Note: Weekly checks can be submitted on any day, but Friday is preferred
    
    // Validate required fields
    if (!check.vehicleId || !check.driverId || !check.odometer || !check.odometerPhoto) {
      return NextResponse.json({ 
        error: 'Missing required fields: vehicleId, driverId, odometer, and odometerPhoto are required' 
      }, { status: 400 })
    }
    
    // Create the weekly check
    const createdCheck = await weeklyCheckService.create(check)
    
    // Also create an odometer log entry to sync the reading for service calculations
    const odometerLog: OdometerLog = {
      id: `odometer-${check.id}`, // Use a predictable ID based on the weekly check
      vehicleId: check.vehicleId,
      driverId: check.driverId,
      date: check.date,
      odometer: check.odometer
    }
    
    try {
      await odometerLogService.create(odometerLog)
      console.log('✅ Created odometer log for weekly check:', odometerLog.id)
    } catch (odometerError) {
      console.error('⚠️ Failed to create odometer log, but weekly check was created:', odometerError)
      // Don't fail the entire request if odometer log creation fails
    }
    
    return NextResponse.json(createdCheck)
  } catch (error) {
    console.error('Error creating weekly check:', error)
    return NextResponse.json({ error: 'Failed to create weekly check' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const check: WeeklyCheck = await request.json()
    const updatedCheck = await weeklyCheckService.update(check.id, check)
    
    // Also update the corresponding odometer log entry
    const odometerLogId = `odometer-${check.id}`
    try {
      const existingOdometerLog = await odometerLogService.getById(odometerLogId)
      if (existingOdometerLog) {
        await odometerLogService.update(odometerLogId, {
          vehicleId: check.vehicleId,
          driverId: check.driverId,
          date: check.date,
          odometer: check.odometer
        })
        console.log('✅ Updated odometer log for weekly check:', odometerLogId)
      } else {
        // Create new odometer log if it doesn't exist
        const odometerLog: OdometerLog = {
          id: odometerLogId,
          vehicleId: check.vehicleId,
          driverId: check.driverId,
          date: check.date,
          odometer: check.odometer
        }
        await odometerLogService.create(odometerLog)
        console.log('✅ Created odometer log for updated weekly check:', odometerLogId)
      }
    } catch (odometerError) {
      console.error('⚠️ Failed to update odometer log, but weekly check was updated:', odometerError)
      // Don't fail the entire request if odometer log update fails
    }
    
    return NextResponse.json(updatedCheck)
  } catch (error) {
    console.error('Error updating weekly check:', error)
    return NextResponse.json({ error: 'Failed to update weekly check' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Weekly check ID is required' }, { status: 400 })
    }
    
    await weeklyCheckService.delete(id)
    
    // Also delete the corresponding odometer log entry
    const odometerLogId = `odometer-${id}`
    try {
      await odometerLogService.delete(odometerLogId)
      console.log('✅ Deleted odometer log for weekly check:', odometerLogId)
    } catch (odometerError) {
      console.error('⚠️ Failed to delete odometer log, but weekly check was deleted:', odometerError)
      // Don't fail the entire request if odometer log deletion fails
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weekly check:', error)
    return NextResponse.json({ error: 'Failed to delete weekly check' }, { status: 500 })
  }
}
