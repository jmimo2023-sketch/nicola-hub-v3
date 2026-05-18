'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, AlertCircle, RefreshCw, Trash2, ExternalLink, Clock } from 'lucide-react'
import { InstagramIcon } from '@/components/ui/instagram-icon'
import { FadeIn } from '@/components/ui/motion'

interface MetaConnection {
  id: string
  ig_user_id: string
  ig_username: string
  ig_followers_count: number
  ig_media_count: number
  isExpired: boolean
  needsRefresh?: boolean
  expires_at: string
  token_refreshed_at?: string
}

export function InstagramConnect({ userId }: { userId: string }) {
  const [connection, setConnection] = useState<MetaConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  // Check for callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('ig_connected') === 'true') {
      setSuccess(true)
      window.history.replaceState({}, '', window.location.pathname)
      checkConnection()
    }
    if (params.get('ig_error')) {
      setError(decodeURIComponent(params.get('ig_error') || 'Error desconocido'))
    }
  }, [])

  async function checkConnection() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('meta_connections')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        const isExpired = new Date(data.expires_at) < new Date()
        const expiresAt = new Date(data.expires_at)
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const needsRefresh = !isExpired && expiresAt < sevenDaysFromNow
        setConnection({ ...data, isExpired, needsRefresh })
      }
    } catch (err) {
      console.error('[InstagramConnect] checkConnection error:', err)
    }
    setLoading(false)
  }

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      // Get auth URL from server action
      const res = await fetch('/api/instagram/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('[InstagramConnect] auth-url error:', data)
        setError(data.error || 'Error generando URL de autenticación')
      }
    } catch (err: any) {
      console.error('[InstagramConnect] handleConnect error:', err)
      setError(err.message)
    }
    setConnecting(false)
  }

  async function handleRefreshToken() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/instagram/refresh-token', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await checkConnection()
      } else {
        setError(data.error || 'Error renovando token')
      }
    } catch (err: any) {
      setError(err.message)
    }
    setRefreshing(false)
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar cuenta de Instagram? Perderás acceso a publicar y ver analytics.')) return
    try {
      const supabase = createClient()
      await supabase.from('meta_connections').delete().eq('user_id', userId)
      setConnection(null)
      setSuccess(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  /** Format remaining days until token expiry */
  function getDaysUntilExpiry(expiresAt: string): number {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
        <RefreshCw size={18} className="animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificando conexión...</span>
      </div>
    )
  }

  // Connected and token valid
  if (connection && !connection.isExpired) {
    const daysLeft = getDaysUntilExpiry(connection.expires_at)
    const showRefreshWarning = connection.needsRefresh || daysLeft <= 14

    return (
      <FadeIn>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
              <InstagramIcon size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">@{connection.ig_username}</span>
                <Check size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">
                {connection.ig_followers_count?.toLocaleString() || 0} seguidores · {connection.ig_media_count || 0} publicaciones
              </span>
            </div>
            <a
              href={`https://instagram.com/${connection.ig_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-muted"
            >
              <ExternalLink size={16} className="text-muted-foreground" />
            </a>
          </div>

          {/* Token refresh warning */}
          {showRefreshWarning && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock size={14} className="text-amber-500 shrink-0" />
              <span className="text-xs text-amber-600 flex-1">
                Token expira en {daysLeft} días. Renueva para mantener el acceso.
              </span>
              <button
                onClick={handleRefreshToken}
                disabled={refreshing}
                className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Renovando...' : 'Renovar'}
              </button>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="text-xs text-destructive hover:underline flex items-center gap-1"
          >
            <Trash2 size={12} />
            Desconectar cuenta
          </button>
        </div>
      </FadeIn>
    )
  }

  // Token expired
  if (connection?.isExpired) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle size={18} className="text-amber-500" />
          <div className="flex-1">
            <span className="text-sm font-medium">Token expirado para @{connection.ig_username}</span>
            <span className="text-xs text-muted-foreground block">Reconecta para seguir publicando</span>
          </div>
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <InstagramIcon size={18} />
          {connecting ? 'Conectando...' : 'Reconectar Instagram'}
        </button>
      </div>
    )
  }

  // Not connected
  return (
    <FadeIn>
      <div className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-destructive">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-500">
            <Check size={16} />
            ¡Instagram conectado exitosamente!
          </div>
        )}
        <div className="text-center space-y-3 p-6 border border-border rounded-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mx-auto">
            <InstagramIcon size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold">Conecta tu Instagram</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Publica, programa y analiza tus contenidos directamente desde Nicola Hub
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <InstagramIcon size={18} />
            {connecting ? 'Conectando...' : 'Conectar con Instagram'}
          </button>
          <p className="text-xs text-muted-foreground">
            Necesitas una cuenta de Instagram Business o Creator.{' '}
            <a
              href="https://help.instagram.com/502981923235522"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Más info
            </a>
          </p>
        </div>
      </div>
    </FadeIn>
  )
}