'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyEmail } from '@/lib/verification'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function verify() {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('No verification token provided.')
        return
      }

      const result = await verifyEmail(token)
      setStatus(result.success ? 'success' : 'error')
      setMessage(result.message)

      // Redirect to home after 3 seconds if successful
      if (result.success) {
        setTimeout(() => {
          router.push('/home')
        }, 3000)
      }
    }

    verify()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center" style={{
      backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white border-4 border-orange-500 p-8 text-center">
          <h1 className="text-4xl font-bold mb-8">
            <span className="text-gray-900">PICK'</span>
            <span className="text-orange-500">EMS</span>
          </h1>

          {status === 'loading' && (
            <div>
              <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Success!</h2>
              <p className="text-gray-700 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to home page...</p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-6xl mb-4">✗</div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
              <p className="text-gray-700 mb-6">{message}</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors cursor-pointer"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
