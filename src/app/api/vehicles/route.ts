import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { Vehicle } from '@/types/fleet'

const DATA_DIR = path.join(process.cwd(), 'data')
const VEHICLES_FILE = path.join(DATA_DIR, 'vehicles.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

// Read vehicles from file
async function readVehicles(): Promise<Vehicle[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(VEHICLES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write vehicles to file
async function writeVehicles(vehicles: Vehicle[]): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(VEHICLES_FILE, JSON.stringify(vehicles, null, 2))
  } catch (error) {
    console.error('Error writing vehicles:', error)
    throw error
  }
}

export async function GET() {
  try {
    const vehicles = await readVehicles()
    return NextResponse.json(vehicles)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read vehicles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const vehicle: Vehicle = await request.json()
    const vehicles = await readVehicles()
    
    // Add new vehicle
    const newVehicles = [vehicle, ...vehicles]
    await writeVehicles(newVehicles)
    
    return NextResponse.json(vehicle)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const vehicle: Vehicle = await request.json()
    const vehicles = await readVehicles()
    
    // Update existing vehicle
    const updatedVehicles = vehicles.map(v => v.id === vehicle.id ? vehicle : v)
    await writeVehicles(updatedVehicles)
    
    return NextResponse.json(vehicle)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }
    
    const vehicles = await readVehicles()
    const filteredVehicles = vehicles.filter(v => v.id !== id)
    await writeVehicles(filteredVehicles)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
