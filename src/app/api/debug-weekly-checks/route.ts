import { NextResponse } from 'next/server'
import { weeklyCheckService } from '@/lib/db-service'
import { getDatabaseType } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Testing weekly checks service...')
    console.log('🔍 Database type:', getDatabaseType())
    console.log('🔍 Environment DB_TYPE:', process.env.DB_TYPE)
    
    // Test getting all weekly checks
    const checks = await weeklyCheckService.getAll()
    console.log('🔍 Weekly checks retrieved:', checks.length)
    console.log('🔍 Weekly checks data:', checks)
    
    // Test creating a test weekly check
    const testCheck = {
      id: `test-${Date.now()}`,
      vehicleId: 'fsr33cyfu0umgxvvoqv',
      driverId: 'admin',
      date: new Date().toISOString().split('T')[0],
      odometer: 99999,
      odometerPhoto: 'data:image/jpeg;base64,test',
      exteriorImages: [],
      interiorImages: [],
      notes: 'Test check for debugging',
      submittedAt: new Date().toISOString()
    }
    
    console.log('🔍 Creating test weekly check:', testCheck.id)
    const createdCheck = await weeklyCheckService.create(testCheck)
    console.log('🔍 Test weekly check created:', createdCheck)
    
    // Try to retrieve it immediately
    const retrievedCheck = await weeklyCheckService.getById(testCheck.id)
    console.log('🔍 Test weekly check retrieved:', retrievedCheck)
    
    // Get all checks again
    const allChecks = await weeklyCheckService.getAll()
    console.log('🔍 All weekly checks after test:', allChecks.length)
    
    // Clean up test check
    await weeklyCheckService.delete(testCheck.id)
    console.log('🔍 Test weekly check deleted')
    
    return NextResponse.json({
      success: true,
      databaseType: getDatabaseType(),
      initialChecks: checks.length,
      testCheckCreated: !!createdCheck,
      testCheckRetrieved: !!retrievedCheck,
      finalChecks: allChecks.length,
      message: 'Debug test completed successfully'
    })
    
  } catch (error) {
    console.error('❌ DEBUG: Error in weekly checks test:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseType: getDatabaseType(),
      environmentDbType: process.env.DB_TYPE
    }, { status: 500 })
  }
}
