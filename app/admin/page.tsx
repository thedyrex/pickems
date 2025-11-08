'use client'

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "@/components/Header"
import { isAdmin } from "@/lib/admin"
import { getMatches, updateMatchScores, DbMatch, updateBracketProgression, clearBracketProgression, clearEntireBracket, toggleDoublePoints } from "@/lib/matches"
import { getTeams, Team } from "@/lib/teams"
import { supabase } from "@/lib/supabase"
import { recalculateMatchScores, clearAllScores, resetMatchPicks } from "@/lib/scoring"
import { getDaySettings, updateDaySetting, resetAllDays, DaySetting } from "@/lib/daySettings"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [matches, setMatches] = useState<DbMatch[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [loadingData, setLoadingData] = useState(true)
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [scoreInputs, setScoreInputs] = useState<Record<string, { team1: string, team2: string }>>({})
  const [showResetPicks, setShowResetPicks] = useState(false)
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
  const [daySettings, setDaySettings] = useState<DaySetting[]>([])
  const [showDaySettings, setShowDaySettings] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const adminStatus = await isAdmin(user)
        setIsAdminUser(adminStatus)
        if (!adminStatus) {
          router.push('/home')
        }
      }
    }
    checkAdmin()
  }, [user, router])

  useEffect(() => {
    async function loadData() {
      setLoadingData(true)
      const [matchesData, teamsData, daySettingsData] = await Promise.all([
        getMatches(),
        getTeams(),
        getDaySettings()
      ])
      setMatches(matchesData)
      setTeams(teamsData)
      setDaySettings(daySettingsData)
      setLoadingData(false)
    }
    if (isAdminUser) {
      loadData()
    }
  }, [isAdminUser])

  const handleSetScores = async (matchId: string, team1Id: string, team2Id: string) => {
    const scores = scoreInputs[matchId]
    if (!scores || scores.team1 === '' || scores.team2 === '') {
      alert('Please enter scores for both teams')
      return
    }

    const team1Score = parseInt(scores.team1)
    const team2Score = parseInt(scores.team2)

    if (team1Score === team2Score) {
      alert('Scores cannot be tied')
      return
    }

    const winnerId = team1Score > team2Score ? team1Id : team2Id
    const loserId = team1Score > team2Score ? team2Id : team1Id
    const success = await updateMatchScores(matchId, team1Score, team2Score, winnerId)

    if (success) {
      // Update bracket progression (move winner/loser to next matches)
      await updateBracketProgression(matchId, winnerId, loserId)

      // Recalculate scores for all users who picked this match
      await recalculateMatchScores(matchId)

      // Refresh matches
      const updatedMatches = await getMatches()
      setMatches(updatedMatches)
      setEditingMatch(null)
      // Clear score inputs for this match
      setScoreInputs(prev => {
        const updated = { ...prev }
        delete updated[matchId]
        return updated
      })
    }
  }

  const handleStartEdit = (matchId: string, team1Score: number | null, team2Score: number | null) => {
    setEditingMatch(matchId)
    setScoreInputs(prev => ({
      ...prev,
      [matchId]: {
        team1: team1Score?.toString() || '',
        team2: team2Score?.toString() || ''
      }
    }))
  }

  const handleCancelEdit = (matchId: string) => {
    setEditingMatch(null)
    setScoreInputs(prev => {
      const updated = { ...prev }
      delete updated[matchId]
      return updated
    })
  }

  const handleToggleDoublePoints = async (matchId: string, currentValue: boolean) => {
    const success = await toggleDoublePoints(matchId, !currentValue)

    if (success) {
      // Refresh matches
      const updatedMatches = await getMatches()
      setMatches(updatedMatches)
    } else {
      alert('Failed to toggle double points')
    }
  }

  const handleClearScores = async (matchId: string) => {
    if (!confirm('Are you sure you want to clear the scores for this match? This will also reset any dependent matches in the bracket.')) {
      return
    }

    const { error } = await supabase
      .from('matches')
      .update({
        team1_score: null,
        team2_score: null,
        winner_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)

    if (!error) {
      // Clear bracket progression (reset dependent matches)
      await clearBracketProgression(matchId)

      // Refresh matches
      const updatedMatches = await getMatches()
      setMatches(updatedMatches)
    } else {
      alert('Failed to clear scores')
    }
  }

  const handleClearAllUserScores = async () => {
    if (!confirm('Are you sure you want to clear ALL user scores? This will reset the entire leaderboard and cannot be undone.')) {
      return
    }

    const success = await clearAllScores()

    if (success) {
      alert('All user scores have been cleared successfully')
    } else {
      alert('Failed to clear user scores. Please check the console for errors.')
    }
  }

  const handleClearEntireBracket = async () => {
    if (!confirm('Are you sure you want to clear the ENTIRE BRACKET? This will reset all match scores and team progressions back to the original state. This cannot be undone.')) {
      return
    }

    const success = await clearEntireBracket()

    if (success) {
      // Refresh matches
      const updatedMatches = await getMatches()
      setMatches(updatedMatches)
      alert('Entire bracket has been cleared successfully')
    } else {
      alert('Failed to clear bracket. Please check the console for errors.')
    }
  }

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatches(prev => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) {
        newSet.delete(matchId)
      } else {
        newSet.add(matchId)
      }
      return newSet
    })
  }

  const handleResetSelectedPicks = async () => {
    if (selectedMatches.size === 0) {
      alert('Please select at least one match to reset')
      return
    }

    const matchList = Array.from(selectedMatches)
      .map(id => {
        const match = matches.find(m => m.id === id)
        return match ? `Match ${match.match_number}` : id
      })
      .join(', ')

    if (!confirm(`Are you sure you want to reset all player picks for: ${matchList}?\n\nThis will delete all user picks and scores for these matches and cannot be undone.`)) {
      return
    }

    const success = await resetMatchPicks(Array.from(selectedMatches))

    if (success) {
      alert(`Player picks have been reset for ${selectedMatches.size} match(es)`)
      setSelectedMatches(new Set())
      setShowResetPicks(false)
    } else {
      alert('Failed to reset player picks. Please check the console for errors.')
    }
  }

  const handleToggleDayEnabled = async (day: number, currentStatus: boolean) => {
    const action = currentStatus ? 'disable' : 'enable'
    if (!confirm(`Are you sure you want to ${action} Day ${day}? ${currentStatus ? 'Users will not be able to make picks for this day.' : 'Users will be able to make picks for this day.'}`)) {
      return
    }

    const success = await updateDaySetting(day, !currentStatus)

    if (success) {
      // Update local state
      const updatedSettings = await getDaySettings()
      setDaySettings(updatedSettings)
      alert(`Day ${day} has been ${currentStatus ? 'disabled' : 'enabled'}`)
    } else {
      alert('Failed to update day setting. Please check the console for errors.')
    }
  }

  const handleResetAllDays = async () => {
    if (!confirm('Are you sure you want to enable ALL days? This will allow users to make picks for all days.')) {
      return
    }

    const success = await resetAllDays()

    if (success) {
      // Update local state
      const updatedSettings = await getDaySettings()
      setDaySettings(updatedSettings)
      alert('All days have been enabled successfully!')
    } else {
      alert('Failed to reset days. Please check the console for errors.')
    }
  }

  const handleResetAllMatches = async () => {
    if (!confirm('Are you sure you want to reset ALL matches?\n\nThis will delete ALL user picks and scores for EVERY match and cannot be undone.')) {
      return
    }

    // Get all match IDs
    const allMatchIds = matches.map(m => m.id)
    const success = await resetMatchPicks(allMatchIds)

    if (success) {
      alert(`All player picks have been reset for ${allMatchIds.length} matches`)
      setSelectedMatches(new Set())
      setShowResetPicks(false)
    } else {
      alert('Failed to reset all player picks. Please check the console for errors.')
    }
  }


  // Redirect if not admin, but don't show loading screen
  if (!loading && (!user || !isAdminUser)) {
    return null
  }

  const dayMatches = matches.filter(m => m.day === selectedDay)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage tournament matches and results</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDaySettings(!showDaySettings)}
                className="px-4 py-2 bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                {showDaySettings ? 'Close Settings' : 'Manage Days'}
              </button>
              <button
                onClick={() => setShowResetPicks(!showResetPicks)}
                className="px-4 py-2 bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors"
              >
                {showResetPicks ? 'Cancel Reset' : 'Reset Player Picks'}
              </button>
              <button
                onClick={handleClearAllUserScores}
                className="px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                Clear All User Scores
              </button>
              <button
                onClick={handleClearEntireBracket}
                className="px-4 py-2 bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
              >
                Clear Entire Bracket
              </button>
            </div>
          </div>
        </div>

        {/* Day settings mode */}
        {showDaySettings && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-400">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Day Availability Settings</h2>
                <p className="text-sm text-gray-600">
                  Enable or disable days for user picks. Disabled days will appear grayed out.
                </p>
              </div>
              <button
                onClick={handleResetAllDays}
                className="px-4 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
              >
                Enable All Days
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {daySettings.map(setting => (
                <div key={setting.day} className={`p-3 border-2 ${
                  setting.is_enabled ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-100'
                }`}>
                  <div className="text-center mb-2">
                    <span className="font-bold text-gray-900">Day {setting.day}</span>
                    <div className={`text-xs font-medium ${
                      setting.is_enabled ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {setting.is_enabled ? '✓ Enabled' : '✗ Disabled'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleDayEnabled(setting.day, setting.is_enabled)}
                    className={`w-full py-1.5 text-sm font-medium transition-colors ${
                      setting.is_enabled
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {setting.is_enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset picks mode */}
        {showResetPicks && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reset Player Picks Mode</h2>
                <p className="text-sm text-gray-600">
                  Select matches to reset player picks and scores. Selected: {selectedMatches.size}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetAllMatches}
                  className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                >
                  Reset ALL Matches
                </button>
                <button
                  onClick={handleResetSelectedPicks}
                  disabled={selectedMatches.size === 0}
                  className={`px-4 py-2 font-medium transition-colors ${
                    selectedMatches.size === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Reset {selectedMatches.size} Match(es)
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Day selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(day => {
            const daySetting = daySettings.find(ds => ds.day === day)
            const isEnabled = daySetting?.is_enabled ?? true

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-orange-500 text-white'
                    : isEnabled
                    ? 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                    : 'bg-gray-300 text-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                Day {day} {!isEnabled && '(Disabled)'}
              </button>
            )
          })}
        </div>

        {/* Matches grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dayMatches.map(match => {
            const team1 = teams.find(t => t.id === match.team1_id)
            const team2 = teams.find(t => t.id === match.team2_id)

            const isEditing = editingMatch === match.id
            const currentScores = scoreInputs[match.id]

            // Grand Final is best of 9 (first to 5), all other matches are best of 5 (first to 3)
            const maxScore = match.round === 'Grand Final' ? 5 : 3

            return (
              <div key={match.id} className={`bg-white border-2 shadow-md p-4 ${
                showResetPicks && selectedMatches.has(match.id)
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-orange-100'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    {showResetPicks && (
                      <input
                        type="checkbox"
                        checked={selectedMatches.has(match.id)}
                        onChange={() => toggleMatchSelection(match.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    )}
                    <span className="text-sm font-bold text-orange-600">Match {match.match_number}</span>
                  </div>
                  <span className="text-xs text-gray-500">{match.start_time} PT</span>
                </div>

                <div className="space-y-2 mb-4">
                  {/* Team 1 */}
                  <div className={`p-3 border-2 ${
                    match.winner_id === team1?.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-900">
                        {team1?.name || match.team1_from_match || 'TBD'}
                      </span>
                      {match.team1_score !== null && match.team1_score !== undefined && !isEditing && (
                        <span className="text-gray-900 font-bold text-lg">{match.team1_score}</span>
                      )}
                    </div>
                    {isEditing && team1 && team2 && (
                      <div className="flex gap-1 justify-center">
                        {Array.from({ length: maxScore + 1 }, (_, i) => i).map(score => (
                          <button
                            key={score}
                            onClick={() => setScoreInputs(prev => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], team1: score.toString() }
                            }))}
                            className={`flex-1 py-2 font-bold transition-colors ${
                              currentScores?.team1 === score.toString()
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-orange-200'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-gray-400 text-sm">vs</div>

                  {/* Team 2 */}
                  <div className={`p-3 border-2 ${
                    match.winner_id === team2?.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-900">
                        {team2?.name || match.team2_from_match || 'TBD'}
                      </span>
                      {match.team2_score !== null && match.team2_score !== undefined && !isEditing && (
                        <span className="text-gray-900 font-bold text-lg">{match.team2_score}</span>
                      )}
                    </div>
                    {isEditing && team1 && team2 && (
                      <div className="flex gap-1 justify-center">
                        {Array.from({ length: maxScore + 1 }, (_, i) => i).map(score => (
                          <button
                            key={score}
                            onClick={() => setScoreInputs(prev => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], team2: score.toString() }
                            }))}
                            className={`flex-1 py-2 font-bold transition-colors ${
                              currentScores?.team2 === score.toString()
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-orange-200'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {team1 && team2 && (
                  <div className="mb-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSetScores(match.id, team1.id, team2.id)}
                          className="flex-1 py-2 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                        >
                          Save Scores
                        </button>
                        <button
                          onClick={() => handleCancelEdit(match.id)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 font-medium hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(match.id, match.team1_score, match.team2_score)}
                        className="w-full py-2 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                      >
                        {match.winner_id ? 'Edit Scores' : 'Set Scores'}
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{match.round}</span>
                    <span className={match.is_upper_bracket ? 'text-blue-600' : 'text-red-600'}>
                      {match.is_upper_bracket ? 'Upper' : 'Lower'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <button
                      onClick={() => handleToggleDoublePoints(match.id, match.is_double_points || false)}
                      className={`text-xs px-3 py-1 font-medium transition-colors ${
                        match.is_double_points
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {match.is_double_points ? '★ Double Points' : 'Make Double Points'}
                    </button>
                    {match.winner_id && (
                      <button
                        onClick={() => handleClearScores(match.id)}
                        className="text-xs px-3 py-1 bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Clear Scores
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
