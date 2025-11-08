import { supabase } from './supabase'
import { DbMatch, UserPick } from './matches'

export interface UserScore {
  id: string
  user_id: string
  match_id: string
  points_earned: number
  correct_winner: boolean
  correct_score: boolean
  created_at?: string
  updated_at?: string
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  email: string
  total_points: number
  correct_winners: number
  correct_scores: number
  matches_scored: number
}

/**
 * Scoring system:
 * - 10 points for correctly predicting the winner
 * - 5 bonus points for correctly predicting the exact score
 * - Total possible: 15 points per match
 * - DOUBLE POINTS: All points are doubled for matches marked as double points (30 points max)
 */
export function calculateMatchScore(
  match: DbMatch,
  userPick: UserPick
): { points: number; correctWinner: boolean; correctScore: boolean } {
  let points = 0
  let correctWinner = false
  let correctScore = false

  // Check if match has been completed
  if (!match.winner_id || match.team1_score === null || match.team2_score === null) {
    return { points: 0, correctWinner: false, correctScore: false }
  }

  // Check if user picked the correct winner
  if (userPick.picked_team_id === match.winner_id) {
    correctWinner = true
    points += 10
  }

  // Check if user predicted the exact score
  if (
    userPick.predicted_team1_score === match.team1_score &&
    userPick.predicted_team2_score === match.team2_score
  ) {
    correctScore = true
    points += 5
  }

  // Double points for matches marked as double points
  if (match.is_double_points) {
    points *= 2
  }

  return { points, correctWinner, correctScore }
}

/**
 * Calculate and save score for a specific user's pick on a match
 */
export async function calculateAndSaveScore(
  userId: string,
  matchId: string
): Promise<boolean> {
  try {
    // Get the match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      console.error('Error fetching match:', matchError)
      return false
    }

    // Get the user's pick
    const { data: userPick, error: pickError } = await supabase
      .from('user_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single()

    if (pickError || !userPick) {
      console.error('Error fetching user pick:', pickError)
      return false
    }

    // Calculate score
    const { points, correctWinner, correctScore } = calculateMatchScore(match, userPick)

    // Save score
    const { error: scoreError } = await supabase
      .from('user_scores')
      .upsert({
        user_id: userId,
        match_id: matchId,
        points_earned: points,
        correct_winner: correctWinner,
        correct_score: correctScore,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,match_id'
      })

    if (scoreError) {
      console.error('Error saving score:', scoreError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in calculateAndSaveScore:', error)
    return false
  }
}

/**
 * Recalculate scores for all users who made picks on a specific match
 * This should be called after an admin sets match results
 */
export async function recalculateMatchScores(matchId: string): Promise<boolean> {
  try {
    // Get all users who made picks for this match
    const { data: picks, error: picksError } = await supabase
      .from('user_picks')
      .select('user_id')
      .eq('match_id', matchId)

    if (picksError) {
      console.error('Error fetching picks:', picksError)
      return false
    }

    if (!picks || picks.length === 0) {
      return true // No picks to score
    }

    // Calculate and save scores for each user
    const results = await Promise.all(
      picks.map(pick => calculateAndSaveScore(pick.user_id, matchId))
    )

    return results.every(result => result === true)
  } catch (error) {
    console.error('Error in recalculateMatchScores:', error)
    return false
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('total_points', { ascending: false })

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return data || []
}

/**
 * Get user's score for a specific match
 */
export async function getUserMatchScore(
  userId: string,
  matchId: string
): Promise<UserScore | null> {
  const { data, error } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user score:', error)
    return null
  }

  return data
}

/**
 * Get all scores for a user
 */
export async function getUserScores(userId: string): Promise<UserScore[]> {
  const { data, error } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user scores:', error)
    return []
  }

  return data || []
}

/**
 * Get user's rank on the leaderboard
 */
export async function getUserRank(userId: string): Promise<number | null> {
  const leaderboard = await getLeaderboard()
  const index = leaderboard.findIndex(entry => entry.user_id === userId)
  return index >= 0 ? index + 1 : null
}

/**
 * Clear all user scores (admin only)
 * This will delete all records from the user_scores table
 */
export async function clearAllScores(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_scores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (error) {
      console.error('Error clearing scores:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in clearAllScores:', error)
    return false
  }
}

/**
 * Reset user picks for specific matches (admin only)
 * This will delete user_picks and user_scores for the selected matches
 */
export async function resetMatchPicks(matchIds: string[]): Promise<boolean> {
  try {
    // Delete user picks for selected matches
    const { error: picksError } = await supabase
      .from('user_picks')
      .delete()
      .in('match_id', matchIds)

    if (picksError) {
      console.error('Error deleting user picks:', picksError)
      return false
    }

    // Delete user scores for selected matches
    const { error: scoresError } = await supabase
      .from('user_scores')
      .delete()
      .in('match_id', matchIds)

    if (scoresError) {
      console.error('Error deleting user scores:', scoresError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in resetMatchPicks:', error)
    return false
  }
}
