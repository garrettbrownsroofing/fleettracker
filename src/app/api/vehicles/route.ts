import { NextRequest, NextResponse } from 'next/server'
import type { Vehicle } from '@/types/fleet'
import { vehicleService } from '@/lib/db-service'

export async function GET() {
  try {
    const vehicles = await vehicleService.getAll()
    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Failed to read vehicles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = request.cookies.get('bft_role')?.value
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const vehicle: Vehicle = await request.json()
    const createdVehicle = await vehicleService.create(vehicle)
    return NextResponse.json(createdVehicle)
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const role = request.cookies.get('bft_role')?.value
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const vehicle: Vehicle = await request.json()
    const updatedVehicle = await vehicleService.update(vehicle.id, vehicle)
    return NextResponse.json(updatedVehicle)
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
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
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }
    
    await vehicleService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
