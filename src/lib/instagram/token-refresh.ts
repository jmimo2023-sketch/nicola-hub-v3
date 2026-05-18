'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { refreshLongLivedToken } from './auth'

/**
 * Check and refresh a single user's token if it's expiring within 7 days
 */
export async function checkAndRefreshToken(userId: string): Promise<{ refreshed: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  const { data: conn, error: fetchError } = await supabase
    .from('meta_connections')
    .select('access_token, expires_at, token_type')
    .eq('user_id', userId)
    .single()

  if (fetchError || !conn) {
    return { refreshed: false, error: 'No se encontró conexión de Instagram' }
  }

  // Only refresh instagram_login tokens
  if (conn.token_type && conn.token_type !== 'instagram_login') {
    return { refreshed: false, error: 'Tipo de token no soportado para refresh' }
  }

  const expiresAt = new Date(conn.expires_at)
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Check if token needs refresh
  if (expiresAt > sevenDaysFromNow) {
    return { refreshed: false } // Token is still valid for more than 7 days
  }

  try {
    const refreshed = await refreshLongLivedToken(conn.access_token)
    const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('meta_connections')
      .update({
        access_token: refreshed.accessToken,
        expires_at: newExpiresAt,
        token_refreshed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      return { refreshed: false, error: `Error actualizando token: ${updateError.message}` }
    }

    return { refreshed: true }
  } catch (err: any) {
    return { refreshed: false, error: `Error renovando token: ${err.message}` }
  }
}

/**
 * Refresh all tokens that are expiring within 7 days
 * For use by Vercel Cron job
 */
export async function refreshAllExpiringTokens(): Promise<{ refreshed: number; errors: number; details: string[] }> {
  const supabase = await createServerSupabaseClient()

  // Find all connections with tokens expiring within 7 days
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: expiringConnections, error: fetchError } = await supabase
    .from('meta_connections')
    .select('user_id, access_token, expires_at, token_type')
    .lt('expires_at', sevenDaysFromNow)
    .eq('token_type', 'instagram_login')

  if (fetchError) {
    return { refreshed: 0, errors: 0, details: [`Error fetching connections: ${fetchError.message}`] }
  }

  if (!expiringConnections || expiringConnections.length === 0) {
    return { refreshed: 0, errors: 0, details: ['No tokens need refresh'] }
  }

  let refreshed = 0
  let errors = 0
  const details: string[] = []

  for (const conn of expiringConnections) {
    try {
      const result = await refreshLongLivedToken(conn.access_token)
      const newExpiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString()

      const { error: updateError } = await supabase
        .from('meta_connections')
        .update({
          access_token: result.accessToken,
          expires_at: newExpiresAt,
          token_refreshed_at: new Date().toISOString(),
        })
        .eq('user_id', conn.user_id)

      if (updateError) {
        errors++
        details.push(`User ${conn.user_id}: Error updating - ${updateError.message}`)
      } else {
        refreshed++
        details.push(`User ${conn.user_id}: Token refreshed, new expiry ${newExpiresAt}`)
      }
    } catch (err: any) {
      errors++
      details.push(`User ${conn.user_id}: ${err.message}`)
    }
  }

  return { refreshed, errors, details }
}