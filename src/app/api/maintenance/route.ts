import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { MaintenanceRecord } from '@/types/fleet'

const DATA_DIR = path.join(process.cwd(), 'data')
const MAINTENANCE_FILE = path.join(DATA_DIR, 'maintenance.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

// Read maintenance records from file
async function readMaintenance(): Promise<MaintenanceRecord[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(MAINTENANCE_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write maintenance records to file
async function writeMaintenance(records: MaintenanceRecord[]): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(MAINTENANCE_FILE, JSON.stringify(records, null, 2))
  } catch (error) {
    console.error('Error writing maintenance records:', error)
    throw error
  }
}

export async function GET() {
  try {
    const records = await readMaintenance()
    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read maintenance records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const record: MaintenanceRecord = await request.json()
    const records = await readMaintenance()
    
    // Add new record
    const newRecords = [record, ...records]
    await writeMaintenance(newRecords)
    
    return NextResponse.json(record)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const record: MaintenanceRecord = await request.json()
    const records = await readMaintenance()
    
    // Update existing record
    const updatedRecords = records.map(r => r.id === record.id ? record : r)
    await writeMaintenance(updatedRecords)
    
    return NextResponse.json(record)
  } catch (error) {
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
    
    const records = await readMaintenance()
    const filteredRecords = records.filter(r => r.id !== id)
    await writeMaintenance(filteredRecords)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete maintenance record' }, { status: 500 })
  }
}
