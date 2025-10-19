import { NextRequest, NextResponse } from 'next/server'
import type { WeeklyCheck } from '@/types/fleet'
import { weeklyCheckService } from '@/lib/db-service'

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
    
    // Validate that the date is a Friday
    const checkDate = new Date(check.date)
    const dayOfWeek = checkDate.getDay()
    if (dayOfWeek !== 5) { // 5 = Friday
      return NextResponse.json({ 
        error: 'Weekly checks must be submitted on Fridays only' 
      }, { status: 400 })
    }
    
    // Validate required fields
    if (!check.vehicleId || !check.driverId || !check.odometer || !check.odometerPhoto) {
      return NextResponse.json({ 
        error: 'Missing required fields: vehicleId, driverId, odometer, and odometerPhoto are required' 
      }, { status: 400 })
    }
    
    const createdCheck = await weeklyCheckService.create(check)
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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weekly check:', error)
    return NextResponse.json({ error: 'Failed to delete weekly check' }, { status: 500 })
  }
}
