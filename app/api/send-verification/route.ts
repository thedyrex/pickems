import { NextRequest, NextResponse } from 'next/server'
import { sendVerification } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, displayName } = await request.json()

    if (!userId || !email || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const sent = await sendVerification(userId, email, displayName)

    return NextResponse.json(
      { success: sent },
      { status: sent ? 200 : 500 }
    )
  } catch (error) {
    console.error('Error in send-verification route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
