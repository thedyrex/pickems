'use client'

import { Team, TEAM_COLORS } from '@/lib/teams'
import { DbMatch, UserPick, getMatchPredictionStats, MatchPredictionStats } from '@/lib/matches'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface MatchCardProps {
  match: DbMatch
  teams: Team[]
  userPick?: UserPick | null
  allUserPicks?: Record<string, UserPick>
  allMatches?: DbMatch[]
  onSavePick?: (matchId: string, teamId: string, team1Score: number | null, team2Score: number | null) => Promise<void>
  isAdmin?: boolean
}

export default function MatchCard({ match, teams, userPick, allUserPicks, allMatches, onSavePick, isAdmin }: MatchCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(userPick?.picked_team_id || null)
  const [team1Score, setTeam1Score] = useState<string>(userPick?.predicted_team1_score?.toString() || '')
  const [team2Score, setTeam2Score] = useState<string>(userPick?.predicted_team2_score?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeUntil, setTimeUntil] = useState<string>('')
  const [localTime, setLocalTime] = useState<string>('')
  const [predictionStats, setPredictionStats] = useState<MatchPredictionStats | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Helper function to resolve team based on user's predictions
  // ONLY resolves if the source match is on the SAME day as the current match
  const resolveTeamFromPrediction = (fromMatch: string | null): string | null => {
    if (!fromMatch || !allUserPicks || !allMatches) return null

    // Extract match ID from formats like "W-M9" or "L-M10"
    // The format is "W-M9" which means "winner of match 9"
    const matchIdMatch = fromMatch.match(/M(\d+)/)
    if (!matchIdMatch) return null

    const sourceMatchNumber = parseInt(matchIdMatch[1])
    const sourceMatchId = `M${sourceMatchNumber}`

    // Find the source match to check its day
    const sourceMatch = allMatches.find(m => m.id === sourceMatchId)

    // Only resolve predictions if source match is on the SAME day
    // This prevents Day 2 showing predictions from Day 1
    if (!sourceMatch || sourceMatch.day !== match.day) return null

    // Find the user's pick for that match
    const sourcePick = allUserPicks[sourceMatchId]

    return sourcePick?.picked_team_id || null
  }

  // Determine teams: use actual teams if set, otherwise resolve from user predictions
  const team1 = teams.find(t => t.id === match.team1_id) ||
                teams.find(t => t.id === resolveTeamFromPrediction(match.team1_from_match))
  const team2 = teams.find(t => t.id === match.team2_id) ||
                teams.find(t => t.id === resolveTeamFromPrediction(match.team2_from_match))

  // Grand Final is best of 9 (first to 5), all other matches are best of 5 (first to 3)
  const maxScore = match.round === 'Grand Final' ? 5 : 3

  // Lock picks if the match has been graded OR if user has saved a pick
  const isMatchGraded = !!match.winner_id
  const hasUserSavedPick = !!(userPick && userPick.picked_team_id)
  const isPickLocked = isMatchGraded || hasUserSavedPick
  // Teams are determined if they're set in DB OR resolved from user's predictions
  const bothTeamsDetermined = (!!match.team1_id && !!match.team2_id) || (!!team1 && !!team2)
  const isDisabled = !onSavePick || !bothTeamsDetermined // Day is disabled OR both teams not determined

  const handleSelect = async (teamId: string) => {
    if (isSubmitting || !onSavePick || isPickLocked) return
    setSelectedTeam(teamId)

    // Auto-set the winning team's score to maxScore (3 or 5) and clear the other team's maxScore
    if (teamId === team1?.id) {
      setTeam1Score(maxScore.toString())
      // Clear team2's score if it was set to maxScore
      if (team2Score === maxScore.toString()) {
        setTeam2Score('')
      }
    } else if (teamId === team2?.id) {
      setTeam2Score(maxScore.toString())
      // Clear team1's score if it was set to maxScore
      if (team1Score === maxScore.toString()) {
        setTeam1Score('')
      }
    }
  }

  const handleSaveClick = () => {
    // Show confirmation dialog
    setIsClosing(false)
    setShowConfirmation(true)
  }

  const handleCancel = () => {
    // Start fade-out animation
    setIsClosing(true)
    // Wait for animation to finish before hiding
    setTimeout(() => {
      setShowConfirmation(false)
      setIsClosing(false)
    }, 200)
  }

  const handleConfirmSave = async () => {
    if (isSubmitting || !onSavePick || !selectedTeam) return

    const score1 = team1Score ? parseInt(team1Score) : null
    const score2 = team2Score ? parseInt(team2Score) : null

    // Validate that scores match the picked winner if both scores are provided
    if (score1 !== null && score2 !== null) {
      // Check if either score exceeds max
      if (score1 > maxScore || score2 > maxScore) {
        alert(`Scores cannot exceed ${maxScore}. This match is first to ${maxScore}.`)
        return
      }

      // Check for negative scores
      if (score1 < 0 || score2 < 0) {
        alert('Scores cannot be negative.')
        return
      }

      if (score1 === score2) {
        alert('Scores cannot be tied. Please predict different scores.')
        return
      }

      // Check that the winning team has reached maxScore
      const winningScore = Math.max(score1, score2)
      if (winningScore !== maxScore) {
        alert(`The winning team must have ${maxScore} points. This is a first to ${maxScore} match.`)
        return
      }

      const predictedWinner = score1 > score2 ? team1?.id : team2?.id
      if (predictedWinner !== selectedTeam) {
        alert('Your score prediction must match your picked winner. The team you picked to win must have a higher score.')
        return
      }
    }

    setIsSubmitting(true)
    setShowConfirmation(false)
    await onSavePick(match.id, selectedTeam, score1, score2)
    setIsSubmitting(false)

    // Don't fetch stats after saving - only show percentages after match is graded
  }

  // Fetch prediction stats ONLY when match is graded (completed)
  // Don't show percentages before match is graded, even if user has picked
  useEffect(() => {
    async function loadPredictionStats() {
      // Only show stats after match is completed
      if (team1 && team2 && isMatchGraded) {
        const stats = await getMatchPredictionStats(match.id, team1.id, team2.id)
        setPredictionStats(stats)
      } else {
        // Clear stats if match is not graded
        setPredictionStats(null)
      }
    }

    loadPredictionStats()
  }, [userPick, team1, team2, match.id, isMatchGraded])

  const getTeamDisplay = (teamId: string | null, fromMatch: string | null, resolvedTeam: Team | undefined) => {
    // If team is set in DB, just show the name
    if (teamId) {
      const team = teams.find(t => t.id === teamId)
      return team?.name || 'Unknown Team'
    }
    // If team is resolved from user's prediction, show name + prediction indicator
    if (resolvedTeam && fromMatch) {
      return `${resolvedTeam.name} (${fromMatch} Pred)`
    }
    // Fallback to placeholder
    if (fromMatch) {
      return fromMatch
    }
    return 'TBD'
  }

  const hasChanges = selectedTeam !== userPick?.picked_team_id ||
    team1Score !== (userPick?.predicted_team1_score?.toString() || '') ||
    team2Score !== (userPick?.predicted_team2_score?.toString() || '')

  // Calculate time until match starts
  useEffect(() => {
    const calculateTimeUntil = () => {
      // Parse the match start time (format: "3:00 PM PT")
      // We need to combine this with the match day to get a full date
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = 10 // November (0-indexed)

      // Map day to actual date in November
      const dayToDate: Record<number, number> = {
        1: 26, // Nov 26
        2: 27, // Nov 27
        3: 28, // Nov 28
        4: 29, // Nov 29
        5: 30, // Nov 30
      }

      const matchDate = dayToDate[match.day]
      if (!matchDate) {
        setTimeUntil('')
        return
      }

      // Parse time (e.g., "3:00 PM")
      const timeMatch = match.start_time.match(/(\d+):(\d+)\s*(AM|PM)/)
      if (!timeMatch) {
        setTimeUntil('')
        return
      }

      let matchHours = parseInt(timeMatch[1])
      const minutes = parseInt(timeMatch[2])
      const isPM = timeMatch[3] === 'PM'

      // Convert to 24-hour format
      if (isPM && matchHours !== 12) matchHours += 12
      if (!isPM && matchHours === 12) matchHours = 0

      // Create match start time in PT (UTC-8)
      const matchDateTime = new Date(currentYear, currentMonth, matchDate, matchHours, minutes)
      // Adjust for PT timezone (UTC-8)
      matchDateTime.setHours(matchDateTime.getHours() + 8) // Convert PT to UTC

      // Format the match time in user's local timezone
      const localTimeStr = matchDateTime.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      })
      setLocalTime(localTimeStr)

      const now = new Date()
      const diff = matchDateTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeUntil('Started')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeUntil(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeUntil(`${hours}h ${mins}m`)
      } else {
        setTimeUntil(`${mins}m`)
      }
    }

    calculateTimeUntil()
    const interval = setInterval(calculateTimeUntil, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [match.day, match.start_time])

  return (
    <div className={`border-2 shadow-md p-3 sm:p-4 mb-3 sm:mb-4 transition-all duration-200 ${
      isDisabled
        ? 'bg-gray-100 border-gray-300 opacity-60'
        : 'bg-white border-orange-100 hover:shadow-lg'
    }`}>
      <div className="flex justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className={`text-xs sm:text-sm font-bold ${isDisabled ? 'text-gray-500' : 'text-orange-600'} whitespace-nowrap`}>
            Match {match.match_number}
          </span>
          {match.is_double_points && (
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-500 text-white text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap">
              Double Points
            </span>
          )}
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-[10px] sm:text-xs text-gray-500 text-right">{localTime || `${match.start_time} PT`}</span>
          {timeUntil && (
            <span className="text-[10px] sm:text-xs font-medium text-orange-600">{timeUntil}</span>
          )}
        </div>
      </div>

      {isDisabled && !isMatchGraded && (
        <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 bg-gray-200 border border-gray-400 text-center">
          <span className="text-[10px] sm:text-xs font-bold text-gray-700">
            {!bothTeamsDetermined ? '⏳ Waiting for teams' : '🔒 Picks disabled'}
          </span>
        </div>
      )}

      <div className="space-y-1.5 sm:space-y-2">
        {/* Team 1 */}
        <div>
          <button
            onClick={() => team1 && bothTeamsDetermined && handleSelect(team1.id)}
            disabled={!team1 || isSubmitting || !onSavePick || isPickLocked || !bothTeamsDetermined}
            className={`w-full p-2 sm:p-3 text-left border-2 transition-all duration-200 group ${
              !team1 || !onSavePick || isPickLocked || !bothTeamsDetermined ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              match.winner_id === team1?.id ? 'bg-green-50 border-green-500' : ''
            } ${
              match.winner_id && match.winner_id !== team1?.id ? 'bg-red-50 border-red-300' : ''
            } ${
              selectedTeam === team1?.id && !match.winner_id ? '' : 'border-gray-200'
            }`}
            style={selectedTeam === team1?.id && !match.winner_id && team1 ? {
              borderColor: TEAM_COLORS[team1.id] || '#f97316',
              backgroundColor: `${TEAM_COLORS[team1.id] || '#f97316'}20`
            } : (team1 && !isPickLocked && !match.winner_id && onSavePick && bothTeamsDetermined ? {
              '--hover-border': TEAM_COLORS[team1.id] || '#f97316'
            } as React.CSSProperties : {})}
            onMouseEnter={(e) => {
              if (team1 && !isPickLocked && !match.winner_id && onSavePick && bothTeamsDetermined && selectedTeam !== team1.id) {
                e.currentTarget.style.borderColor = TEAM_COLORS[team1.id] || '#f97316'
              }
            }}
            onMouseLeave={(e) => {
              if (team1 && !isPickLocked && !match.winner_id && onSavePick && bothTeamsDetermined && selectedTeam !== team1.id) {
                e.currentTarget.style.borderColor = '#e5e7eb'
              }
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {match.team1_score !== null && match.team1_score !== undefined && (
                <span className="text-gray-900 font-bold text-base sm:text-lg">{match.team1_score}</span>
              )}
              {team1?.logo && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={team1.logo}
                    alt={team1.name}
                    width={32}
                    height={32}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              )}
              <span className="font-bold text-gray-900 flex-1 text-xs sm:text-base">
                {getTeamDisplay(match.team1_id, match.team1_from_match, team1)}
              </span>
              {match.winner_id === team1?.id && (
                <span className="text-green-600 text-[10px] sm:text-sm font-medium whitespace-nowrap">✓ WIN</span>
              )}
            </div>
          </button>
          {team1 && onSavePick && bothTeamsDetermined && (
            <div className="mt-1.5 sm:mt-2 flex gap-1 justify-center">
              {Array.from({ length: maxScore + 1 }, (_, i) => i).map(score => {
                // Only disable maxScore (3 or 5) if other team also has maxScore (prevents 3-3 or 5-5 tie)
                const team2ScoreNum = team2Score ? parseInt(team2Score) : null
                const isIllogical = score === maxScore && team2ScoreNum === maxScore

                return (
                  <button
                    key={score}
                    onClick={() => {
                      setTeam1Score(score.toString())
                      // Auto-select team1 as winner if they click maxScore (3 or 5)
                      if (score === maxScore && team1) {
                        setSelectedTeam(team1.id)
                      }
                      // If score < maxScore, auto-set team2 to maxScore and select them as winner
                      if (score < maxScore && team2) {
                        setTeam2Score(maxScore.toString())
                        setSelectedTeam(team2.id)
                      }
                    }}
                    disabled={isPickLocked || isIllogical}
                    className={`flex-1 py-1.5 sm:py-2 font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      team1Score === score.toString()
                        ? 'bg-orange-500 text-white'
                        : isIllogical
                        ? 'bg-gray-200 text-gray-400'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-200'
                    }`}
                  >
                    {score}
                  </button>
                )
              })}
            </div>
          )}
          {predictionStats && predictionStats.total_picks > 0 && team1 && isMatchGraded && (
            <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2">
              <div className="flex-1 bg-gray-200 h-1.5 sm:h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${predictionStats.team1_percentage}%`,
                    backgroundColor: TEAM_COLORS[team1.id] || '#f97316'
                  }}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-600 whitespace-nowrap min-w-[32px] sm:min-w-[36px] text-right">
                {predictionStats.team1_percentage}%
              </span>
            </div>
          )}
        </div>

        <div className="text-center text-gray-400 text-xs sm:text-sm py-0.5">vs</div>

        {/* Team 2 */}
        <div>
          <button
            onClick={() => team2 && bothTeamsDetermined && handleSelect(team2.id)}
            disabled={!team2 || isSubmitting || !onSavePick || isPickLocked || !bothTeamsDetermined}
            className={`w-full p-2 sm:p-3 text-left border-2 transition-all duration-200 group ${
              !team2 || !onSavePick || isPickLocked || !bothTeamsDetermined ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              match.winner_id === team2?.id ? 'bg-green-50 border-green-500' : ''
            } ${
              match.winner_id && match.winner_id !== team2?.id ? 'bg-red-50 border-red-300' : ''
            } ${
              selectedTeam === team2?.id && !match.winner_id ? '' : 'border-gray-200'
            }`}
            style={selectedTeam === team2?.id && !match.winner_id && team2 ? {
              borderColor: TEAM_COLORS[team2.id] || '#f97316',
              backgroundColor: `${TEAM_COLORS[team2.id] || '#f97316'}20`
            } : (team2 && !isPickLocked && !match.winner_id && onSavePick && bothTeamsDetermined ? {
              '--hover-border': TEAM_COLORS[team2.id] || '#f97316'
            } as React.CSSProperties : {})}
            onMouseEnter={(e) => {
              if (team2 && !isPickLocked && !match.winner_id && onSavePick && bothTeamsDetermined && selectedTeam !== team2.id) {
                e.currentTarget.style.borderColor = TEAM_COLORS[team2.id] || '#f97316'
              }
            }}
            onMouseLeave={(e) => {
              if (team2 && !isPickLocked && !match.winner_id && onSavePick && bothTeamsDetermined && selectedTeam !== team2.id) {
                e.currentTarget.style.borderColor = '#e5e7eb'
              }
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {match.team2_score !== null && match.team2_score !== undefined && (
                <span className="text-gray-900 font-bold text-base sm:text-lg">{match.team2_score}</span>
              )}
              {team2?.logo && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={team2.logo}
                    alt={team2.name}
                    width={32}
                    height={32}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              )}
              <span className="font-bold text-gray-900 flex-1 text-xs sm:text-base">
                {getTeamDisplay(match.team2_id, match.team2_from_match, team2)}
              </span>
              {match.winner_id === team2?.id && (
                <span className="text-green-600 text-[10px] sm:text-sm font-medium whitespace-nowrap">✓ WIN</span>
              )}
            </div>
          </button>
          {team2 && onSavePick && bothTeamsDetermined && (
            <div className="mt-1.5 sm:mt-2 flex gap-1 justify-center">
              {Array.from({ length: maxScore + 1 }, (_, i) => i).map(score => {
                // Only disable maxScore (3 or 5) if other team also has maxScore (prevents 3-3 or 5-5 tie)
                const team1ScoreNum = team1Score ? parseInt(team1Score) : null
                const isIllogical = score === maxScore && team1ScoreNum === maxScore

                return (
                  <button
                    key={score}
                    onClick={() => {
                      setTeam2Score(score.toString())
                      // Auto-select team2 as winner if they click maxScore (3 or 5)
                      if (score === maxScore && team2) {
                        setSelectedTeam(team2.id)
                      }
                      // If score < maxScore, auto-set team1 to maxScore and select them as winner
                      if (score < maxScore && team1) {
                        setTeam1Score(maxScore.toString())
                        setSelectedTeam(team1.id)
                      }
                    }}
                    disabled={isPickLocked || isIllogical}
                    className={`flex-1 py-1.5 sm:py-2 font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      team2Score === score.toString()
                        ? 'bg-orange-500 text-white'
                        : isIllogical
                        ? 'bg-gray-200 text-gray-400'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-200'
                    }`}
                  >
                    {score}
                  </button>
                )
              })}
            </div>
          )}
          {predictionStats && predictionStats.total_picks > 0 && team2 && isMatchGraded && (
            <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2">
              <div className="flex-1 bg-gray-200 h-1.5 sm:h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${predictionStats.team2_percentage}%`,
                    backgroundColor: TEAM_COLORS[team2.id] || '#f97316'
                  }}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-600 whitespace-nowrap min-w-[32px] sm:min-w-[36px] text-right">
                {predictionStats.team2_percentage}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      {onSavePick && hasChanges && selectedTeam && !isPickLocked && bothTeamsDetermined && (
        <button
          onClick={handleSaveClick}
          disabled={isSubmitting}
          className="mt-2 sm:mt-3 w-full py-1.5 sm:py-2 bg-orange-500 text-white text-xs sm:text-base font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : 'Save Pick'}
        </button>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-in',
            opacity: isClosing ? 0 : 1
          }}
        >
          <div
            className="bg-white border-4 border-orange-500 p-6 max-w-md w-full shadow-xl"
            style={{
              animation: isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-in',
              opacity: isClosing ? 0 : 1
            }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">CONFIRM YOUR PICK</h3>
            <p className="text-gray-700 mb-6">
              ⚠️ <strong>ONCE YOU SAVE YOUR PICK, IT WILL BE LOCKED AND CANNOT BE CHANGED. ARE YOU SURE YOU WANT TO SAVE THIS PREDICTION?</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'SAVING...' : 'CONFIRM & LOCK'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>

      {userPick && userPick.picked_team_id && !hasChanges && !isMatchGraded && (
        <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-green-600 font-medium">
          ✓ PICK LOCKED
        </div>
      )}

      {isMatchGraded && (
        <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-gray-600 font-medium">
          Match completed
        </div>
      )}

      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500">
          <span className="truncate">{match.round}</span>
          <span className={`${match.is_upper_bracket ? 'text-blue-600' : 'text-red-600'} whitespace-nowrap ml-2`}>
            {match.is_upper_bracket ? 'Upper' : 'Lower'} Bracket
          </span>
        </div>
      </div>
    </div>
  )
}
