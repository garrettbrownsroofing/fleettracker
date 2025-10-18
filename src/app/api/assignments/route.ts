import { NextRequest, NextResponse } from 'next/server'
import type { Assignment } from '@/types/fleet'
import { assignmentService } from '@/lib/db-service'

export async function GET() {
  try {
    const assignments = await assignmentService.getAll()
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Failed to read assignments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignment: Assignment = await request.json()
    const createdAssignment = await assignmentService.create(assignment)
    return NextResponse.json(createdAssignment)
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const assignment: Assignment = await request.json()
    const updatedAssignment = await assignmentService.update(assignment.id, assignment)
    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error('Error updating assignment:', error)
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
    
    await assignmentService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
