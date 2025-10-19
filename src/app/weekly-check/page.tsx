'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { readJson, writeJson, apiGet, apiPost } from '@/lib/storage'
import { computeServiceStatuses, computeLatestOdometer } from '@/lib/service'
import type { Assignment, WeeklyCheck, Vehicle, MaintenanceRecord } from '@/types/fleet'
import ErrorBoundary from '@/components/ErrorBoundary'

const STORAGE_WEEKLY_CHECKS = 'bft:weekly_checks'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Helper function to get the next Friday
function getNextFriday(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7
  const nextFriday = new Date(today)
  nextFriday.setDate(today.getDate() + daysUntilFriday)
  return nextFriday.toISOString().slice(0, 10)
}

// Helper function to check if today is Friday
function isTodayFriday(): boolean {
  return new Date().getDay() === 5
}

// Compress image to reduce file size for Firestore
async function compressImage(file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      
      console.log(`📸 Image compressed: ${file.name} - Original: ${file.size} bytes, Compressed: ${compressedDataUrl.length} bytes`)
      resolve(compressedDataUrl)
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

async function fileToDataUrl(file: File): Promise<string> {
  // Compress images to reduce size for Firestore
  if (file.type.startsWith('image/')) {
    return await compressImage(file)
  }
  
  // For non-image files, use original method
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function WeeklyCheckPageContent() {
  const { user, isAuthenticated, role } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [weeklyChecks, setWeeklyChecks] = useState<WeeklyCheck[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'odometer' | 'exterior' | 'interior' | 'review'>('odometer')
  
  // Camera refs
  const odometerCameraRef = useRef<HTMLInputElement>(null)
  const exteriorCameraRef = useRef<HTMLInputElement>(null)
  const interiorCameraRef = useRef<HTMLInputElement>(null)

  // Wait for session to be hydrated before redirecting
  useEffect(() => {
    console.log('Weekly check page - Authentication state:', { isAuthenticated, user })
    if (isAuthenticated === false) {
      console.log('User not authenticated, redirecting to login')
      router.replace('/login')
    }
  }, [isAuthenticated, user, router])

  // Load data from API on component mount - only when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      async function loadData() {
        try {
          setLoading(true)
          const [assignmentsData, vehiclesData, checksData, maintenanceData] = await Promise.all([
            apiGet<Assignment[]>('/api/assignments'),
            apiGet<Vehicle[]>('/api/vehicles'),
            apiGet<WeeklyCheck[]>('/api/weekly-checks'),
            apiGet<MaintenanceRecord[]>('/api/maintenance')
          ])
          setAssignments(assignmentsData)
          setVehicles(vehiclesData)
          setWeeklyChecks(checksData)
          setMaintenance(maintenanceData)
        } catch (error) {
          console.error('Failed to load data:', error)
          // For multi-user support, we don't fallback to localStorage
          // Data must come from Firestore
          alert('Failed to load data from server. Please check your connection and try again.')
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [isAuthenticated])

  if (isAuthenticated === false) {
    return null
  }

  // Get vehicles based on role
  const myVehicleIds = useMemo(() => new Set(assignments.filter(a => a.driverId === user!.id).map(a => a.vehicleId)), [assignments, user])
  const myVehicles = vehicles.filter(v => myVehicleIds.has(v.id))
  const allVehicles = vehicles // For admin view
  const displayVehicles = role === 'admin' ? allVehicles : myVehicles

  const [form, setForm] = useState<{ 
    vehicleId: string
    date: string
    odometer: string
    odometerPhoto: File | null
    exteriorPhotos: File[]
    interiorPhotos: File[]
    notes: string
  }>(() => ({
    vehicleId: displayVehicles[0]?.id || '',
    date: new Date().toISOString().slice(0, 10), // Default to today
    odometer: '',
    odometerPhoto: null,
    exteriorPhotos: [],
    interiorPhotos: [],
    notes: '',
  }))

  // Calculate current odometer and service statuses for each vehicle
  const vehicleStatuses = useMemo(() => {
    return displayVehicles.map(vehicle => {
      const currentOdometer = computeLatestOdometer(vehicle.id, [], maintenance, vehicles, weeklyChecks)
      const serviceStatuses = computeServiceStatuses(vehicle.id, [], maintenance, vehicles, 250, weeklyChecks)
      const hasOverdue = serviceStatuses.some(s => s.status === 'overdue')
      const hasWarning = serviceStatuses.some(s => s.status === 'warning')
      const overallStatus = hasOverdue ? 'overdue' : hasWarning ? 'warning' : 'good'
      
      return {
        vehicle,
        currentOdometer,
        serviceStatuses,
        overallStatus
      }
    })
  }, [displayVehicles, maintenance, vehicles, weeklyChecks])

  async function submit() {
    if (!form.vehicleId || !form.odometer || !form.odometerPhoto) return
    
    // For users, ensure they can only log for their assigned vehicles
    if (role === 'user' && !myVehicleIds.has(form.vehicleId)) {
      console.error('User attempted to log for unassigned vehicle')
      return
    }
    
    setSubmitting(true)
    
    // Convert files to data URLs
    const odometerPhotoDataUrl = await fileToDataUrl(form.odometerPhoto!)
    const exteriorDataUrls: string[] = []
    for (const file of form.exteriorPhotos) {
      exteriorDataUrls.push(await fileToDataUrl(file))
    }
    const interiorDataUrls: string[] = []
    for (const file of form.interiorPhotos) {
      interiorDataUrls.push(await fileToDataUrl(file))
    }
    
    const weeklyCheck: WeeklyCheck = {
      id: generateId(),
      vehicleId: form.vehicleId,
      driverId: user!.id,
      date: form.date,
      odometer: Math.max(0, Number(form.odometer) || 0),
      odometerPhoto: odometerPhotoDataUrl,
      exteriorImages: exteriorDataUrls,
      interiorImages: interiorDataUrls,
      notes: form.notes || undefined,
      submittedAt: new Date().toISOString()
    }
    
    // Check total data size before submitting
    const totalSize = JSON.stringify(weeklyCheck).length
    console.log('🔍 Total data size:', totalSize, 'bytes')
    
    if (totalSize > 900000) { // 900KB limit (leaving some buffer under 1MB)
      console.warn('⚠️ Data size is large:', totalSize, 'bytes')
      const sizeBreakdown = {
        odometerPhoto: odometerPhotoDataUrl.length,
        exteriorImages: exteriorDataUrls.reduce((sum, img) => sum + img.length, 0),
        interiorImages: interiorDataUrls.reduce((sum, img) => sum + img.length, 0)
      }
      console.log('📊 Size breakdown:', sizeBreakdown)
      
      // If still too large, compress more aggressively
      if (totalSize > 1000000) {
        alert('Images are too large. Please reduce the number of photos or try again with smaller images.')
        setSubmitting(false)
        return
      }
    }
    
    try {
      console.log('🚀 Submitting weekly check:', weeklyCheck)
      const result = await apiPost<WeeklyCheck>('/api/weekly-checks', weeklyCheck)
      console.log('✅ Weekly check submitted successfully:', result)
      
      // Update local state immediately
      setWeeklyChecks(prev => [weeklyCheck, ...prev])
      
      // Reset form
      setForm(f => ({
        vehicleId: displayVehicles[0]?.id || '',
        date: new Date().toISOString().slice(0, 10), // Reset to today
        odometer: '',
        odometerPhoto: null,
        exteriorPhotos: [],
        interiorPhotos: [],
        notes: '',
      }))
      setCurrentStep('odometer')
      
      // Show success message
      alert('Check In Complete!')
      
    } catch (error) {
      console.error('Failed to submit weekly check:', error)
      // For multi-user support, we don't fallback to localStorage
      // Data must be saved to Firestore
      alert('Failed to submit weekly check. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading while session is hydrating
  if (isAuthenticated === null || loading) {
    return (
      <main className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Loading...</h3>
              <p className="text-gray-400">Syncing data from server</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'odometer':
        return form.vehicleId && form.odometer && form.odometerPhoto
      case 'exterior':
        return form.exteriorPhotos.length > 0
      case 'interior':
        return form.interiorPhotos.length > 0
      case 'review':
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep === 'odometer') setCurrentStep('exterior')
    else if (currentStep === 'exterior') setCurrentStep('interior')
    else if (currentStep === 'interior') setCurrentStep('review')
  }

  const prevStep = () => {
    if (currentStep === 'exterior') setCurrentStep('odometer')
    else if (currentStep === 'interior') setCurrentStep('exterior')
    else if (currentStep === 'review') setCurrentStep('interior')
  }

  return (
    <main className="min-h-screen gradient-bg">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-2">
            Weekly Vehicle Check
          </h1>
          <p className="text-gray-400 text-lg">
            Complete your weekly odometer reading and cleanliness inspection
          </p>
          <div className="mt-2 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-200 text-sm">
              💡 Weekly checks are typically completed on Fridays, but can be submitted any day.
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['odometer', 'exterior', 'interior', 'review'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-blue-500 text-white' 
                    : ['odometer', 'exterior', 'interior'].indexOf(currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep === step ? 'text-white' : 'text-gray-400'
                }`}>
                  {step === 'odometer' ? 'Odometer' : 
                   step === 'exterior' ? 'Exterior' :
                   step === 'interior' ? 'Interior' : 'Review'}
                </span>
                {index < 3 && (
                  <div className={`w-8 h-0.5 ml-4 ${
                    ['odometer', 'exterior', 'interior'].indexOf(currentStep) > index
                      ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="modern-card animate-fade-in-up">
          {currentStep === 'odometer' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <h2 className="text-xl font-bold text-white">Odometer Reading</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle</label>
                  <select
                    className="modern-input w-full"
                    value={form.vehicleId}
                    onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                  >
                    <option value="">Select vehicle</option>
                    {displayVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    className="modern-input w-full"
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Next Friday: {getNextFriday()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Odometer Reading</label>
                  <input
                    className="modern-input w-full"
                    placeholder="Enter current mileage"
                    inputMode="numeric"
                    value={form.odometer}
                    onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Odometer Photo</label>
                  <div className="space-y-2">
                    <input
                      ref={odometerCameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setForm(f => ({ ...f, odometerPhoto: file }))
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => odometerCameraRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-300 hover:border-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {form.odometerPhoto ? (
                        <div className="text-center">
                          <div className="text-green-500 text-2xl mb-2">✓</div>
                          <p>Photo captured: {form.odometerPhoto.name}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-4xl mb-2">📷</div>
                          <p>Tap to take odometer photo</p>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'exterior' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <span className="text-xl">🚗</span>
                </div>
                <h2 className="text-xl font-bold text-white">Exterior Photos</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">
                  Take photos of the vehicle exterior. Include front, back, and sides.
                </p>
                
                <div>
                  <input
                    ref={exteriorCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      setForm(f => ({ ...f, exteriorPhotos: [...f.exteriorPhotos, ...files] }))
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => exteriorCameraRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-300 hover:border-green-400 hover:text-green-300 transition-colors"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p>Add Exterior Photos</p>
                    </div>
                  </button>
                </div>
                
                {form.exteriorPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Exterior photos ({form.exteriorPhotos.length}):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {form.exteriorPhotos.map((file, index) => (
                        <div key={index} className="bg-gray-700 p-2 rounded text-sm text-gray-300">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'interior' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-xl">🪑</span>
                </div>
                <h2 className="text-xl font-bold text-white">Interior Photos</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">
                  Take photos of the vehicle interior. Include seats, dashboard, and floor.
                </p>
                
                <div>
                  <input
                    ref={interiorCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      setForm(f => ({ ...f, interiorPhotos: [...f.interiorPhotos, ...files] }))
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => interiorCameraRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-300 hover:border-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p>Add Interior Photos</p>
                    </div>
                  </button>
                </div>
                
                {form.interiorPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Interior photos ({form.interiorPhotos.length}):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {form.interiorPhotos.map((file, index) => (
                        <div key={index} className="bg-gray-700 p-2 rounded text-sm text-gray-300">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
                <h2 className="text-xl font-bold text-white">Review & Submit</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Check Summary</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><strong>Vehicle:</strong> {displayVehicles.find(v => v.id === form.vehicleId)?.label}</p>
                    <p><strong>Date:</strong> {form.date}</p>
                    <p><strong>Odometer:</strong> {form.odometer} miles</p>
                    <p><strong>Odometer Photo:</strong> {form.odometerPhoto ? '✓ Captured' : '❌ Missing'}</p>
                    <p><strong>Exterior Photos:</strong> {form.exteriorPhotos.length}</p>
                    <p><strong>Interior Photos:</strong> {form.interiorPhotos.length}</p>
                    {form.notes && <p><strong>Notes:</strong> {form.notes}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    className="modern-input w-full"
                    rows={3}
                    placeholder="Any additional notes about the vehicle condition..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 'odometer'}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStep === 'review' ? (
              <button
                onClick={submit}
                disabled={submitting || !canProceed()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Weekly Check'
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function WeeklyCheckPage() {
  return (
    <ErrorBoundary>
      <WeeklyCheckPageContent />
    </ErrorBoundary>
  )
}
