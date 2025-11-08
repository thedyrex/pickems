import { supabase } from './supabase'
import { Match } from './bracket'

export interface DbMatch {
  id: string;
  match_number: number;
  team1_id: string | null;
  team2_id: string | null;
  team1_from_match: string | null;
  team2_from_match: string | null;
  winner_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  day: number;
  start_time: string;
  round: string;
  is_upper_bracket: boolean;
  is_double_points?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPick {
  id: string;
  user_id: string;
  match_id: string;
  picked_team_id: string;
  predicted_team1_score: number | null;
  predicted_team2_score: number | null;
  created_at?: string;
  updated_at?: string;
}

// Fetch all matches
export async function getMatches(): Promise<DbMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_number', { ascending: true })

  if (error) {
    console.error('Error fetching matches:', error)
    return []
  }

  return data || []
}

// Fetch matches for a specific day
export async function getMatchesByDay(day: number): Promise<DbMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('day', day)
    .order('match_number', { ascending: true })

  if (error) {
    console.error('Error fetching matches:', error)
    return []
  }

  return data || []
}

// Update match winner (admin only)
export async function updateMatchWinner(matchId: string, winnerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('matches')
    .update({ winner_id: winnerId, updated_at: new Date().toISOString() })
    .eq('id', matchId)

  if (error) {
    console.error('Error updating match winner:', error)
    return false
  }

  return true
}

// Get user's pick for a match
export async function getUserPick(userId: string, matchId: string) {
  const { data, error } = await supabase
    .from('user_picks')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user pick:', error)
    return null
  }

  return data
}

// Save user's pick with optional score prediction
export async function saveUserPick(
  userId: string,
  matchId: string,
  pickedTeamId: string,
  team1Score?: number | null,
  team2Score?: number | null
): Promise<boolean> {
  const { error } = await supabase
    .from('user_picks')
    .upsert({
      user_id: userId,
      match_id: matchId,
      picked_team_id: pickedTeamId,
      predicted_team1_score: team1Score,
      predicted_team2_score: team2Score,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,match_id'
    })

  if (error) {
    console.error('Error saving user pick:', error)
    return false
  }

  return true
}

// Update match scores (admin only)
export async function updateMatchScores(
  matchId: string,
  team1Score: number,
  team2Score: number,
  winnerId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('matches')
    .update({
      team1_score: team1Score,
      team2_score: team2Score,
      winner_id: winnerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId)

  if (error) {
    console.error('Error updating match scores:', error)
    return false
  }

  return true
}

// Get all picks for a user
export async function getUserPicks(userId: string) {
  const { data, error } = await supabase
    .from('user_picks')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching user picks:', error)
    return []
  }

  return data || []
}

/**
 * Update future matches based on the winner of a completed match
 * This handles bracket progression automatically
 */
export async function updateBracketProgression(
  completedMatchId: string,
  winnerId: string,
  loserId: string
): Promise<boolean> {
  try {
    const allMatches = await getMatches()
    const winnerTag = `W-${completedMatchId}`
    const loserTag = `L-${completedMatchId}`

    // Find matches that depend on this completed match
    const matchesToUpdate = allMatches.filter(
      match =>
        match.team1_from_match === winnerTag ||
        match.team2_from_match === winnerTag ||
        match.team1_from_match === loserTag ||
        match.team2_from_match === loserTag
    )

    // Update each dependent match
    for (const match of matchesToUpdate) {
      const updates: Partial<DbMatch> = { updated_at: new Date().toISOString() }

      // Update team1 if it depends on this match
      if (match.team1_from_match === winnerTag) {
        updates.team1_id = winnerId
      } else if (match.team1_from_match === loserTag) {
        updates.team1_id = loserId
      }

      // Update team2 if it depends on this match
      if (match.team2_from_match === winnerTag) {
        updates.team2_id = winnerId
      } else if (match.team2_from_match === loserTag) {
        updates.team2_id = loserId
      }

      // Only update if there are changes
      if (updates.team1_id || updates.team2_id) {
        const { error } = await supabase
          .from('matches')
          .update(updates)
          .eq('id', match.id)

        if (error) {
          console.error(`Error updating match ${match.id}:`, error)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error in updateBracketProgression:', error)
    return false
  }
}

/**
 * Clear bracket progression for dependent matches
 * This resets team1_id and team2_id back to null for matches that depend on the cleared match
 */
export async function clearBracketProgression(completedMatchId: string): Promise<boolean> {
  try {
    const allMatches = await getMatches()
    const winnerTag = `W-${completedMatchId}`
    const loserTag = `L-${completedMatchId}`

    // Find matches that depend on this completed match
    const matchesToReset = allMatches.filter(
      match =>
        match.team1_from_match === winnerTag ||
        match.team2_from_match === winnerTag ||
        match.team1_from_match === loserTag ||
        match.team2_from_match === loserTag
    )

    // Reset each dependent match
    for (const match of matchesToReset) {
      const updates: Partial<DbMatch> = { updated_at: new Date().toISOString() }

      // Reset team1 if it depends on this match
      if (match.team1_from_match === winnerTag || match.team1_from_match === loserTag) {
        updates.team1_id = null
      }

      // Reset team2 if it depends on this match
      if (match.team2_from_match === winnerTag || match.team2_from_match === loserTag) {
        updates.team2_id = null
      }

      // Only update if there are changes
      if (updates.team1_id !== undefined || updates.team2_id !== undefined) {
        const { error } = await supabase
          .from('matches')
          .update(updates)
          .eq('id', match.id)

        if (error) {
          console.error(`Error resetting match ${match.id}:`, error)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error in clearBracketProgression:', error)
    return false
  }
}

/**
 * Toggle double points for a match (admin only)
 */
export async function toggleDoublePoints(matchId: string, isDoublePoints: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('matches')
    .update({ is_double_points: isDoublePoints, updated_at: new Date().toISOString() })
    .eq('id', matchId)

  if (error) {
    console.error('Error toggling double points:', error)
    return false
  }

  return true
}

export interface MatchPredictionStats {
  team1_percentage: number;
  team2_percentage: number;
  total_picks: number;
}

/**
 * Check if a day has started (first match time has passed)
 * Returns true if the day should be locked for picks
 */
export async function isDayLocked(day: number): Promise<boolean> {
  // Day 1 is never locked by time
  if (day === 1) {
    return false
  }

  // Get all matches for this day
  const matches = await getMatchesByDay(day)

  if (matches.length === 0) {
    return false
  }

  // Find the earliest match start time for this day
  const earliestMatch = matches.reduce((earliest, match) => {
    return match.start_time < earliest.start_time ? match : earliest
  }, matches[0])

  // Parse the match date and time
  // Matches are in November 2024 (Nov 26-30)
  const year = 2024
  const month = 10 // November (0-indexed)
  const dateMap: Record<number, number> = {
    1: 26, // Day 1 = Nov 26
    2: 27, // Day 2 = Nov 27
    3: 28, // Day 3 = Nov 28
    4: 29, // Day 4 = Nov 29
    5: 30  // Day 5 = Nov 30
  }
  const date = dateMap[day]

  if (!date) {
    return false
  }

  // Parse time (format: "7:00 PM EST" or "12:00 PM EST")
  const timeMatch = earliestMatch.start_time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!timeMatch) {
    return false
  }

  let hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])
  const period = timeMatch[3].toUpperCase()

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }

  // Create match start time in EST (UTC-5)
  const matchStartTime = new Date(Date.UTC(year, month, date, hours + 5, minutes, 0))

  // Get current time
  const now = new Date()

  // Day is locked if current time is past the match start time
  return now >= matchStartTime
}

/**
 * Get prediction statistics for a match
 * Returns percentage of users who picked each team
 */
export async function getMatchPredictionStats(matchId: string, team1Id: string | null, team2Id: string | null): Promise<MatchPredictionStats | null> {
  if (!team1Id || !team2Id) {
    return null
  }

  const { data, error } = await supabase
    .from('user_picks')
    .select('picked_team_id')
    .eq('match_id', matchId)

  if (error) {
    console.error('Error fetching match predictions:', error)
    return null
  }

  if (!data || data.length === 0) {
    return {
      team1_percentage: 0,
      team2_percentage: 0,
      total_picks: 0
    }
  }

  const team1Picks = data.filter(pick => pick.picked_team_id === team1Id).length
  const team2Picks = data.filter(pick => pick.picked_team_id === team2Id).length
  const totalPicks = data.length

  return {
    team1_percentage: totalPicks > 0 ? Math.round((team1Picks / totalPicks) * 100) : 0,
    team2_percentage: totalPicks > 0 ? Math.round((team2Picks / totalPicks) * 100) : 0,
    total_picks: totalPicks
  }
}

/**
 * Clear all bracket data - reset all matches to initial state
 * This will clear all scores, winners, and reset team progressions
 */
export async function clearEntireBracket(): Promise<boolean> {
  try {
    const allMatches = await getMatches()

    // For each match, clear scores and winner
    for (const match of allMatches) {
      const updates: Partial<DbMatch> = {
        team1_score: null,
        team2_score: null,
        winner_id: null,
        updated_at: new Date().toISOString()
      }

      // Also reset team IDs for matches that don't have from_match set (they depend on other matches)
      if (match.team1_from_match) {
        updates.team1_id = null
      }
      if (match.team2_from_match) {
        updates.team2_id = null
      }

      const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', match.id)

      if (error) {
        console.error(`Error clearing match ${match.id}:`, error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in clearEntireBracket:', error)
    return false
  }
}
