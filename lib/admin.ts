import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user?.email) return false

  const { data, error } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email)
    .single()

  if (error || !data) return false
  return true
}

export async function checkAdminAccess(user: User | null): Promise<boolean> {
  return await isAdmin(user)
}
