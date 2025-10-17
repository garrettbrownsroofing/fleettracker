import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // In production, integrate with an email API (e.g., Resend/SES)
    console.log('[notify]', JSON.stringify(body))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }
}
