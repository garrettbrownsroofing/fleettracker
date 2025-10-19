import { NextRequest, NextResponse } from 'next/server'
import type { MaintenanceRecord } from '@/types/fleet'
import { maintenanceService } from '@/lib/db-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const records = await maintenanceService.getAll()
    const res = NextResponse.json(records)
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return NextResponse.json({ error: 'Failed to read maintenance records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const record: MaintenanceRecord = await request.json()
    const createdRecord = await maintenanceService.create(record)
    return NextResponse.json(createdRecord)
  } catch (error) {
    console.error('Error creating maintenance record:', error)
    return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const record: MaintenanceRecord = await request.json()
    const updatedRecord = await maintenanceService.update(record.id, record)
    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error('Error updating maintenance record:', error)
    return NextResponse.json({ error: 'Failed to update maintenance record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Maintenance record ID is required' }, { status: 400 })
    }
    
    await maintenanceService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting maintenance record:', error)
    return NextResponse.json({ error: 'Failed to delete maintenance record' }, { status: 500 })
  }
}
