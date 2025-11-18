import { NextRequest, NextResponse } from 'next/server'
import { driverService } from '@/lib/db-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Admin user doesn't have a driver record, so we'll return false for them
    // (they can see the prompt, but we won't track it server-side)
    if (userId === 'admin') {
      return NextResponse.json({ seen: false })
    }

    const driver = await driverService.getById(userId)
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ seen: driver.pwaPromptSeen === true })
  } catch (error) {
    console.error('Error checking PWA prompt status:', error)
    return NextResponse.json({ error: 'Failed to check prompt status' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Admin user doesn't have a driver record, so we'll just return success
    if (userId === 'admin') {
      return NextResponse.json({ success: true })
    }

    const driver = await driverService.getById(userId)
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Update the driver record to mark prompt as seen
    await driverService.update(userId, { pwaPromptSeen: true })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking PWA prompt as seen:', error)
    return NextResponse.json({ error: 'Failed to mark prompt as seen' }, { status: 500 })
  }
}

