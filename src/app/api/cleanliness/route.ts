import { NextRequest, NextResponse } from 'next/server'
import type { CleanlinessLog } from '@/types/fleet'
import { cleanlinessService } from '@/lib/db-service'

export async function GET() {
  try {
    const logs = await cleanlinessService.getAll()
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching cleanliness logs:', error)
    return NextResponse.json({ error: 'Failed to read cleanliness logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const log: CleanlinessLog = await request.json()
    const createdLog = await cleanlinessService.create(log)
    return NextResponse.json(createdLog)
  } catch (error) {
    console.error('Error creating cleanliness log:', error)
    return NextResponse.json({ error: 'Failed to create cleanliness log' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const log: CleanlinessLog = await request.json()
    const updatedLog = await cleanlinessService.update(log.id, log)
    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error('Error updating cleanliness log:', error)
    return NextResponse.json({ error: 'Failed to update cleanliness log' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Cleanliness log ID is required' }, { status: 400 })
    }
    
    await cleanlinessService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cleanliness log:', error)
    return NextResponse.json({ error: 'Failed to delete cleanliness log' }, { status: 500 })
  }
}
