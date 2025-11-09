import { supabase } from './supabase'

export interface DaySetting {
  day: number
  is_enabled: boolean
  updated_at?: string
}

/**
 * Get all day settings
 */
export async function getDaySettings(): Promise<DaySetting[]> {
  const { data, error } = await supabase
    .from('day_settings')
    .select('*')
    .order('day', { ascending: true })

  if (error) {
    console.error('Error fetching day settings:', error)
    return []
  }

  return data || []
}

/**
 * Get setting for a specific day
 */
export async function getDaySetting(day: number): Promise<DaySetting | null> {
  const { data, error } = await supabase
    .from('day_settings')
    .select('*')
    .eq('day', day)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching day setting:', error)
    return null
  }

  return data
}

/**
 * Update a day's enabled status (admin only)
 */
export async function updateDaySetting(day: number, isEnabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('day_settings')
    .update({
      is_enabled: isEnabled,
      updated_at: new Date().toISOString()
    })
    .eq('day', day)

  if (error) {
    console.error('Error updating day setting:', error)
    return false
  }

  return true
}

/**
 * Reset all days to enabled (admin only)
 */
export async function resetAllDays(): Promise<boolean> {
  const { error } = await supabase
    .from('day_settings')
    .update({
      is_enabled: true,
      updated_at: new Date().toISOString()
    })
    .neq('day', 0) // Update all rows

  if (error) {
    console.error('Error resetting all days:', error)
    return false
  }

  return true
}

/**
 * Auto-enable the next day when current day starts
 * This should be called when checking day lock status
 * Special case: When Day 1 starts, both Day 1 and Day 2 are enabled
 */
export async function autoEnableNextDay(currentDay: number, isCurrentDayLocked: boolean): Promise<void> {
  // Only auto-enable if the current day just became locked
  if (!isCurrentDayLocked || currentDay >= 5) {
    return
  }

  const nextDay = currentDay + 1

  // Check if next day is already enabled
  const nextDaySetting = await getDaySetting(nextDay)

  if (nextDaySetting && !nextDaySetting.is_enabled) {
    // Enable the next day
    await updateDaySetting(nextDay, true)
  }

  // Special case: When Day 1 starts, also enable Day 2
  if (currentDay === 1) {
    const day2Setting = await getDaySetting(2)
    if (day2Setting && !day2Setting.is_enabled) {
      await updateDaySetting(2, true)
    }
  }
}
