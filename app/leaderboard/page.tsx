'use client'

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "@/components/Header"
import { getLeaderboard, getUserRank, LeaderboardEntry } from "@/lib/scoring"
import Link from "next/link"

export default function LeaderboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoadingData(true)
      const leaderboardData = await getLeaderboard()
      setLeaderboard(leaderboardData)

      // Get user rank if logged in
      if (user) {
        const rank = await getUserRank(user.id)
        setUserRank(rank)
      }

      setLoadingData(false)
    }

    if (!loading) {
      loadData()
    }
  }, [user, loading])

  // No loading screen - just show the page immediately

  // Check if everyone has zero points
  const hasAnyScores = leaderboard.some(entry => entry.total_points > 0)

  return (
    <div className="min-h-screen bg-white" style={{
      backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Leaderboard
          </h2>
          <p className="text-gray-600">
            See how you rank against other players
          </p>
          {!user && (
            <div className="mt-4 inline-block px-6 py-3 bg-orange-100 border-2 border-orange-500">
              <p className="text-sm text-gray-700 mb-2">
                Want to compete? Sign up to make your picks!
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
              >
                Sign Up / Login
              </Link>
            </div>
          )}
          {userRank && (
            <div className="mt-4 inline-block px-6 py-3 bg-orange-100 border-2 border-orange-500">
              <span className="text-lg font-bold text-gray-900">
                Your Rank: #{userRank}
              </span>
            </div>
          )}
        </div>

        {/* Scoring Info */}
        <div className="mb-8 p-6 bg-orange-50 border-2 border-orange-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Scoring System</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-bold text-orange-600">10 points</span>
              <span className="text-gray-700"> - Correct winner prediction</span>
            </div>
            <div>
              <span className="font-bold text-orange-600">5 points</span>
              <span className="text-gray-700"> - Exact score prediction</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-600">
            Maximum possible: 15 points per match
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white border-2 border-orange-100 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-200">
              <thead className="bg-orange-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Total Points
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Correct Winners
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Exact Scores
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Matches Scored
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user_id === user?.id
                  const rankDisplay = index + 1

                  return (
                    <tr
                      key={entry.user_id}
                      className={`${
                        isCurrentUser ? 'bg-orange-100 border-l-4 border-orange-600' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-lg font-bold ${
                            rankDisplay === 1 ? 'text-yellow-500' :
                            rankDisplay === 2 ? 'text-gray-400' :
                            rankDisplay === 3 ? 'text-orange-700' :
                            'text-gray-700'
                          }`}>
                            {rankDisplay === 1 ? '🥇' :
                             rankDisplay === 2 ? '🥈' :
                             rankDisplay === 3 ? '🥉' :
                             `#${rankDisplay}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.display_name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-bold text-orange-600">(You)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {entry.total_points}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {entry.correct_winners}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {entry.correct_scores}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {entry.matches_scored}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {(leaderboard.length === 0 || !hasAnyScores) && (
            <div className="text-center py-12">
              <p className="text-gray-500">No scores yet. Matches need to be completed first!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
