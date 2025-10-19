import { NextRequest, NextResponse } from 'next/server'
import type { OdometerLog } from '@/types/fleet'
import { odometerLogService } from '@/lib/db-service'

export async function GET() {
  try {
    const logs = await odometerLogService.getAll()
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching odometer logs:', error)
    return NextResponse.json({ error: 'Failed to read odometer logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const log: OdometerLog = await request.json()
    const createdLog = await odometerLogService.create(log)
    return NextResponse.json(createdLog)
  } catch (error) {
    console.error('Error creating odometer log:', error)
    return NextResponse.json({ error: 'Failed to create odometer log' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const log: OdometerLog = await request.json()
    const updatedLog = await odometerLogService.update(log.id, log)
    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error('Error updating odometer log:', error)
    return NextResponse.json({ error: 'Failed to update odometer log' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Odometer log ID is required' }, { status: 400 })
    }
    
    await odometerLogService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting odometer log:', error)
    return NextResponse.json({ error: 'Failed to delete odometer log' }, { status: 500 })
  }
}
