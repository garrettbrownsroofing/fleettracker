import { NextRequest, NextResponse } from 'next/server'
import type { WeeklyCheck, OdometerLog } from '@/types/fleet'
import { weeklyCheckService, odometerLogService } from '@/lib/db-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('🔍 GET /api/weekly-checks - Fetching weekly checks...')
    console.log('🔍 Database type:', process.env.DB_TYPE || 'firestore')
    
    const checks = await weeklyCheckService.getAll()
    console.log('✅ Weekly checks fetched:', checks.length, 'items')
    console.log('📋 Weekly checks data:', checks)
    
    // Debug: Log each check's vehicle ID to help with debugging
    checks.forEach((check, index) => {
      console.log(`📋 Weekly check ${index + 1}:`, {
        id: check.id,
        vehicleId: check.vehicleId,
        date: check.date,
        odometer: check.odometer
      })
    })
    
    const res = NextResponse.json(checks)
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  } catch (error) {
    console.error('❌ Error fetching weekly checks:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: 'Failed to read weekly checks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const check: WeeklyCheck = await request.json()
    console.log('📝 POST /api/weekly-checks - Creating weekly check:', check)
    console.log('🔍 Database type:', process.env.DB_TYPE || 'firestore')
    console.log('🔍 Environment check:', {
      DB_TYPE: process.env.DB_TYPE,
      GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID ? 'SET' : 'NOT_SET',
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT_SET'
    })
    console.log('🔍 Check data size:', JSON.stringify(check).length, 'bytes')
    console.log('🔍 Data structure validation:', {
      hasId: !!check.id,
      hasVehicleId: !!check.vehicleId,
      hasDriverId: !!check.driverId,
      hasDate: !!check.date,
      hasOdometer: typeof check.odometer === 'number',
      hasOdometerPhoto: !!check.odometerPhoto,
      hasSubmittedAt: !!check.submittedAt,
      exteriorImagesType: Array.isArray(check.exteriorImages),
      interiorImagesType: Array.isArray(check.interiorImages),
      notesType: typeof check.notes
    })
    
    // Note: Weekly checks can be submitted on any day, but Friday is preferred
    
    // Validate required fields
    if (!check.vehicleId || !check.driverId || !check.odometer || !check.odometerPhoto) {
      console.error('❌ Missing required fields:', { vehicleId: !!check.vehicleId, driverId: !!check.driverId, odometer: !!check.odometer, odometerPhoto: !!check.odometerPhoto })
      return NextResponse.json({ 
        error: 'Missing required fields: vehicleId, driverId, odometer, and odometerPhoto are required' 
      }, { status: 400 })
    }
    
    // Validate data types
    if (typeof check.odometer !== 'number' || check.odometer < 0) {
      console.error('❌ Invalid odometer value:', check.odometer)
      return NextResponse.json({ 
        error: 'Invalid odometer value: must be a positive number' 
      }, { status: 400 })
    }
    
    // Validate data structure
    if (!check.id || typeof check.id !== 'string') {
      console.error('❌ Invalid ID:', check.id)
      return NextResponse.json({ 
        error: 'Invalid ID: must be a non-empty string' 
      }, { status: 400 })
    }
    
    if (!check.date || typeof check.date !== 'string') {
      console.error('❌ Invalid date:', check.date)
      return NextResponse.json({ 
        error: 'Invalid date: must be a valid date string' 
      }, { status: 400 })
    }
    
    if (!check.submittedAt || typeof check.submittedAt !== 'string') {
      console.error('❌ Invalid submittedAt:', check.submittedAt)
      return NextResponse.json({ 
        error: 'Invalid submittedAt: must be a valid timestamp string' 
      }, { status: 400 })
    }
    
    // Validate optional fields
    if (check.notes !== undefined && check.notes !== null && typeof check.notes !== 'string') {
      console.error('❌ Invalid notes:', check.notes)
      return NextResponse.json({ 
        error: 'Invalid notes: must be a string or undefined' 
      }, { status: 400 })
    }
    
    if (!Array.isArray(check.exteriorImages)) {
      console.error('❌ Invalid exteriorImages:', check.exteriorImages)
      return NextResponse.json({ 
        error: 'Invalid exteriorImages: must be an array' 
      }, { status: 400 })
    }
    
    if (!Array.isArray(check.interiorImages)) {
      console.error('❌ Invalid interiorImages:', check.interiorImages)
      return NextResponse.json({ 
        error: 'Invalid interiorImages: must be an array' 
      }, { status: 400 })
    }
    
    // Validate image data format
    if (check.odometerPhoto && !check.odometerPhoto.startsWith('data:image/')) {
      console.error('❌ Invalid odometer photo format:', check.odometerPhoto.substring(0, 50) + '...')
      return NextResponse.json({ 
        error: 'Invalid odometer photo: must be a valid base64 data URL' 
      }, { status: 400 })
    }
    
    if (check.exteriorImages.length > 0 && check.exteriorImages.some(img => !img.startsWith('data:image/'))) {
      console.error('❌ Invalid exterior image format')
      return NextResponse.json({ 
        error: 'Invalid exterior images: must be valid base64 data URLs' 
      }, { status: 400 })
    }
    
    if (check.interiorImages.length > 0 && check.interiorImages.some(img => !img.startsWith('data:image/'))) {
      console.error('❌ Invalid interior image format')
      return NextResponse.json({ 
        error: 'Invalid interior images: must be valid base64 data URLs' 
      }, { status: 400 })
    }
    
    // Check if data is too large for Firestore (1MB limit per document)
    const dataSize = JSON.stringify(check).length
    console.log('🔍 Data size breakdown:', {
      totalSize: dataSize,
      odometerPhotoSize: check.odometerPhoto ? check.odometerPhoto.length : 0,
      exteriorImagesSize: check.exteriorImages ? check.exteriorImages.reduce((sum, img) => sum + img.length, 0) : 0,
      interiorImagesSize: check.interiorImages ? check.interiorImages.reduce((sum, img) => sum + img.length, 0) : 0
    })
    
    if (dataSize > 1000000) { // 1MB in bytes
      console.error('❌ Data too large for Firestore:', dataSize, 'bytes')
      return NextResponse.json({ 
        error: 'Data too large: images must be compressed or reduced in size' 
      }, { status: 400 })
    }
    
    // Test Firestore connection before creating the weekly check
    try {
      console.log('🔍 Testing Firestore connection...')
      const { getFirestore } = await import('@/lib/database')
      const db = getFirestore()
      await db.collection('_test').limit(1).get()
      console.log('✅ Firestore connection verified')
    } catch (connectionError) {
      console.error('❌ Firestore connection failed:', connectionError)
      return NextResponse.json({ 
        error: 'Database connection failed. Please try again later.' 
      }, { status: 503 })
    }
    
    // Create the weekly check
    console.log('💾 Creating weekly check in database...')
    const createdCheck = await weeklyCheckService.create(check)
    console.log('✅ Weekly check created successfully:', createdCheck)
    
    // Also create an odometer log entry to sync the reading for service calculations
    const odometerLog: OdometerLog = {
      id: `odometer-${check.id}`, // Use a predictable ID based on the weekly check
      vehicleId: check.vehicleId,
      driverId: check.driverId,
      date: check.date,
      odometer: check.odometer
    }
    
    try {
      await odometerLogService.create(odometerLog)
    } catch (odometerError) {
      console.error('⚠️ Failed to create odometer log, but weekly check was created:', odometerError)
      // Don't fail the entire request if odometer log creation fails
    }
    
    return NextResponse.json(createdCheck)
  } catch (error) {
    console.error('Error creating weekly check:', error)
    return NextResponse.json({ error: 'Failed to create weekly check' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const check: WeeklyCheck = await request.json()
    const updatedCheck = await weeklyCheckService.update(check.id, check)
    
    // Also update the corresponding odometer log entry
    const odometerLogId = `odometer-${check.id}`
    try {
      const existingOdometerLog = await odometerLogService.getById(odometerLogId)
      if (existingOdometerLog) {
        await odometerLogService.update(odometerLogId, {
          vehicleId: check.vehicleId,
          driverId: check.driverId,
          date: check.date,
          odometer: check.odometer
        })
        console.log('✅ Updated odometer log for weekly check:', odometerLogId)
      } else {
        // Create new odometer log if it doesn't exist
        const odometerLog: OdometerLog = {
          id: odometerLogId,
          vehicleId: check.vehicleId,
          driverId: check.driverId,
          date: check.date,
          odometer: check.odometer
        }
        await odometerLogService.create(odometerLog)
        console.log('✅ Created odometer log for updated weekly check:', odometerLogId)
      }
    } catch (odometerError) {
      console.error('⚠️ Failed to update odometer log, but weekly check was updated:', odometerError)
      // Don't fail the entire request if odometer log update fails
    }
    
    return NextResponse.json(updatedCheck)
  } catch (error) {
    console.error('Error updating weekly check:', error)
    return NextResponse.json({ error: 'Failed to update weekly check' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Weekly check ID is required' }, { status: 400 })
    }
    
    await weeklyCheckService.delete(id)
    
    // Also delete the corresponding odometer log entry
    const odometerLogId = `odometer-${id}`
    try {
      await odometerLogService.delete(odometerLogId)
      console.log('✅ Deleted odometer log for weekly check:', odometerLogId)
    } catch (odometerError) {
      console.error('⚠️ Failed to delete odometer log, but weekly check was deleted:', odometerError)
      // Don't fail the entire request if odometer log deletion fails
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weekly check:', error)
    return NextResponse.json({ error: 'Failed to delete weekly check' }, { status: 500 })
  }
}
