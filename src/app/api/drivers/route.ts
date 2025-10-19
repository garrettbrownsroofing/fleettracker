import { NextRequest, NextResponse } from 'next/server'
import type { Driver } from '@/types/fleet'
import { driverService } from '@/lib/db-service'

export async function GET() {
  try {
    const drivers = await driverService.getAll()
    return NextResponse.json(drivers)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json({ error: 'Failed to read drivers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = request.cookies.get('bft_role')?.value
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const driver: Driver = await request.json()
    const createdDriver = await driverService.create(driver)
    return NextResponse.json(createdDriver)
  } catch (error) {
    console.error('Error creating driver:', error)
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const role = request.cookies.get('bft_role')?.value
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const driver: Driver = await request.json()
    const updatedDriver = await driverService.update(driver.id, driver)
    return NextResponse.json(updatedDriver)
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const role = request.cookies.get('bft_role')?.value
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 })
    }
    
    await driverService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting driver:', error)
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 })
  }
}
