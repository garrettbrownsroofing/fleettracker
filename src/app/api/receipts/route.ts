import { NextRequest, NextResponse } from 'next/server'
import type { Receipt } from '@/types/fleet'
import { receiptService } from '@/lib/db-service'

export async function GET() {
  try {
    const receipts = await receiptService.getAll()
    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: 'Failed to read receipts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const receipt: Receipt = await request.json()
    const createdReceipt = await receiptService.create(receipt)
    return NextResponse.json(createdReceipt)
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const receipt: Receipt = await request.json()
    const updatedReceipt = await receiptService.update(receipt.id, receipt)
    return NextResponse.json(updatedReceipt)
  } catch (error) {
    console.error('Error updating receipt:', error)
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 })
    }
    
    await receiptService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 })
  }
}
