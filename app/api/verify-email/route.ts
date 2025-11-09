import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const result = await verifyEmail(token)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    })
  } catch (error) {
    console.error('Error in verify-email route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
