import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { Assignment } from '@/types/fleet'

const DATA_DIR = path.join(process.cwd(), 'data')
const ASSIGNMENTS_FILE = path.join(DATA_DIR, 'assignments.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

// Read assignments from file
async function readAssignments(): Promise<Assignment[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(ASSIGNMENTS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write assignments to file
async function writeAssignments(assignments: Assignment[]): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2))
  } catch (error) {
    console.error('Error writing assignments:', error)
    throw error
  }
}

export async function GET() {
  try {
    const assignments = await readAssignments()
    return NextResponse.json(assignments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read assignments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignment: Assignment = await request.json()
    const assignments = await readAssignments()
    
    // Add new assignment
    const newAssignments = [assignment, ...assignments]
    await writeAssignments(newAssignments)
    
    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const assignment: Assignment = await request.json()
    const assignments = await readAssignments()
    
    // Update existing assignment
    const updatedAssignments = assignments.map(a => a.id === assignment.id ? assignment : a)
    await writeAssignments(updatedAssignments)
    
    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    const assignments = await readAssignments()
    const filteredAssignments = assignments.filter(a => a.id !== id)
    await writeAssignments(filteredAssignments)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
