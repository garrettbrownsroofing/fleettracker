import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { Driver } from '@/types/fleet'

const DATA_DIR = path.join(process.cwd(), 'data')
const DRIVERS_FILE = path.join(DATA_DIR, 'drivers.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

// Read drivers from file
async function readDrivers(): Promise<Driver[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(DRIVERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write drivers to file
async function writeDrivers(drivers: Driver[]): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(DRIVERS_FILE, JSON.stringify(drivers, null, 2))
  } catch (error) {
    console.error('Error writing drivers:', error)
    throw error
  }
}

export async function GET() {
  try {
    const drivers = await readDrivers()
    return NextResponse.json(drivers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read drivers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const driver: Driver = await request.json()
    const drivers = await readDrivers()
    
    // Add new driver
    const newDrivers = [driver, ...drivers]
    await writeDrivers(newDrivers)
    
    return NextResponse.json(driver)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const driver: Driver = await request.json()
    const drivers = await readDrivers()
    
    // Update existing driver
    const updatedDrivers = drivers.map(d => d.id === driver.id ? driver : d)
    await writeDrivers(updatedDrivers)
    
    return NextResponse.json(driver)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 })
    }
    
    const drivers = await readDrivers()
    const filteredDrivers = drivers.filter(d => d.id !== id)
    await writeDrivers(filteredDrivers)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 })
  }
}
