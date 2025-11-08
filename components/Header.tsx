'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'

export default function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const adminStatus = await isAdmin(user)
        setIsAdminUser(adminStatus)
      }
    }
    checkAdmin()
  }, [user])

  const handleSignOut = () => {
    signOut()
    router.push('/')
  }

  return (
    <header className="w-full bg-white border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            <Link href={user ? "/home" : "/"} className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-orange-600 transition-colors whitespace-nowrap">
              Pick'ems
            </Link>
            {user && (
              <Link
                href="/home"
                className={`text-xs sm:text-sm font-medium transition-colors whitespace-nowrap hidden sm:inline ${
                  pathname === '/home'
                    ? 'text-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                My Picks
              </Link>
            )}
            {isAdminUser && (
              <Link
                href="/admin"
                className={`text-xs sm:text-sm font-medium transition-colors whitespace-nowrap hidden md:inline ${
                  pathname === '/admin'
                    ? 'text-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/leaderboard"
              className={`text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/leaderboard'
                  ? 'text-orange-600'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              Leaderboard
            </Link>
            <div className="relative flex-shrink-0">
              {user ? (
                <>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors duration-200 cursor-pointer"
                  >
                    <span className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                      {user?.user_metadata?.display_name || user?.email}
                    </span>
                    <svg
                      className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-orange-100 shadow-lg z-10">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/"
                  className="px-3 sm:px-6 py-2 bg-orange-500 text-white text-xs sm:text-base font-medium hover:bg-orange-600 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
