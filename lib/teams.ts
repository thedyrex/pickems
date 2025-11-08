import { supabase } from './supabase'

export interface Team {
  id: string;
  name: string;
  logo?: string | null;
  seed?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Team primary colors for UI theming (based on actual team logos)
export const TEAM_COLORS: Record<string, string> = {
  'spacestation': '#eab308', // Yellow (Spacestation)
  'team-peps': '#f59e0b', // Orange/Yellow (Team Peps)
  'crazy-raccoon': '#dc2626', // Red (Crazy Raccoon)
  'al-qadsiah': '#dc2626', // Red (Al Qadsiah)
  'geekay-esports': '#2563eb', // Blue (Geekay Esports)
  'weibo-gaming': '#ec4899', // Pink (Weibo Gaming)
  'team-cc': '#8b5cf6', // Purple (Team CC)
  't1': '#dc2626', // Red (T1)
  'twisted-minds': '#06b6d4', // Cyan (Twisted Minds)
  'team-falcons': '#10b981', // Green/Teal (Team Falcons)
  'varrel': '#1f2937', // Black/Dark Gray (VARREL)
  'team-liquid': '#1e40af', // Blue (Team Liquid)
}

// Fetch all teams from Supabase
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching teams:', error)
    return []
  }

  return data || []
}

// Fetch a single team by ID
export async function getTeamById(id: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching team:', error)
    return null
  }

  return data
}

// Update a team's logo
export async function updateTeamLogo(teamId: string, logoUrl: string): Promise<boolean> {
  const { error } = await supabase
    .from('teams')
    .update({ logo: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', teamId)

  if (error) {
    console.error('Error updating team logo:', error)
    return false
  }

  return true
}

// Static team IDs for reference
export const TEAM_IDS = {
  spacestation: 'spacestation',
  teamPeps: 'team-peps',
  crazyRaccoon: 'crazy-raccoon',
  alQadsiah: 'al-qadsiah',
  geekayEsports: 'geekay-esports',
  weiboGaming: 'weibo-gaming',
  teamCC: 'team-cc',
  t1: 't1',
  twistedMinds: 'twisted-minds',
  teamFalcons: 'team-falcons',
  varrel: 'varrel',
  teamLiquid: 'team-liquid',
} as const
