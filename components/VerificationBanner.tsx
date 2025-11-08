'use client'

import { useState } from 'react'

interface VerificationBannerProps {
  userId: string
  onResend?: () => void
}

export default function VerificationBanner({ userId, onResend }: VerificationBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')

  const handleResend = async () => {
    setIsResending(true)
    setMessage('')

    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      setMessage(data.message || 'Verification email sent!')

      if (onResend) {
        onResend()
      }
    } catch (error) {
      console.error('Error resending verification:', error)
      setMessage('Failed to send email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-orange-100 border-2 border-orange-500 p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-gray-900">
            ⚠️ Please verify your email address to ensure you can access your account.
          </p>
          {message && (
            <p className="text-xs text-orange-700 mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={handleResend}
          disabled={isResending}
          className="px-4 py-2 bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {isResending ? 'Sending...' : 'Resend Email'}
        </button>
      </div>
    </div>
  )
}
