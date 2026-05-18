'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/ui/motion'
import { ConnectionCardSkeleton, StatsRowSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Sparkles, Calendar, TrendingUp, AlertCircle, CheckCircle2,
  Lightbulb, ArrowRight, BarChart3, FileText, Clock, Target,
  Users, ImageIcon, ExternalLink, RefreshCw, AlertTriangle
} from 'lucide-react'
import { InstagramIcon } from '@/components/ui/instagram-icon'
import type { AdvisorInsight } from '@/lib/ai/advisor-engine'

interface IgConnection {
  connected: boolean
  expired?: boolean
  username?: string
  igUserId?: string
  followersCount?: number
  mediaCount?: number
}

interface ContentStats {
  total: number
  drafts: number
  scheduled: number
  published: number
  thisWeek: number
}

interface Profile {
  displayName: string | null
  language: string
  brandVoice: Record<string, unknown>
}

export function HomeDashboard() {
  const [igConnection, setIgConnection] = useState<IgConnection | null>(null)
  const [igConnectionLoading, setIgConnectionLoading] = useState(true)
  const [stats, setStats] = useState<ContentStats>({ total: 0, drafts: 0, scheduled: 0, published: 0, thisWeek: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [insights, setInsights] = useState<AdvisorInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [weeklyRec, setWeeklyRec] = useState<string>('')
  const [igEngagement, setIgEngagement] = useState<number | null>(null)
  const [igEngagementLoading, setIgEngagementLoading] = useState(false)

  // Load IG connection
  const loadIgConnection = useCallback(async () => {
    setIgConnectionLoading(true)
    try {
      const res = await fetch('/api/instagram/connection')
      if (res.ok) {
        const data = await res.json()
        setIgConnection(data)
      } else {
        setIgConnection({ connected: false })
      }
    } catch (e) {
      console.error('[Home] Failed to load IG connection:', e)
      setIgConnection({ connected: false })
    } finally {
      setIgConnectionLoading(false)
    }
  }, [])

  // Load content stats from Supabase client-side
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: contentItems } = await supabase
        .from('content_items')
        .select('id, status, created_at')
        .eq('user_id', user.id)

      if (contentItems) {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        setStats({
          total: contentItems.length,
          drafts: contentItems.filter(c => c.status === 'draft').length,
          scheduled: contentItems.filter(c => c.status === 'scheduled').length,
          published: contentItems.filter(c => c.status === 'published').length,
          thisWeek: contentItems.filter(c => new Date(c.created_at) >= weekAgo).length,
        })
      }
    } catch (e) {
      console.error('[Home] Failed to load stats:', e)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Load profile
  const loadProfile = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('display_name, language, brand_voice')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProfile({
          displayName: data.display_name,
          language: data.language || 'es',
          brandVoice: data.brand_voice || {},
        })
      }
    } catch (e) {
      console.error('[Home] Failed to load profile:', e)
    }
  }, [])

  // Load AI insights
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true)
    try {
      const res = await fetch('/api/insights/recommendations')
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights || [])
        setHealthScore(data.contentHealthScore ?? null)
        setWeeklyRec(data.weeklyRecommendation || '')
      }
    } catch (e) {
      console.error('[Home] Failed to load insights:', e)
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  // Load real engagement rate (non-blocking)
  const loadEngagement = useCallback(async () => {
    if (!igConnection?.connected || igConnection?.expired) return
    setIgEngagementLoading(true)
    try {
      const res = await fetch('/api/instagram/analytics')
      if (res.ok) {
        const data = await res.json()
        if (data?.current) setIgEngagement(data.current.engagement_rate)
      }
    } catch (e) {
      // Silently fail — engagement is a nice-to-have
    } finally {
      setIgEngagementLoading(false)
    }
  }, [igConnection])

  useEffect(() => {
    loadIgConnection()
    loadStats()
    loadProfile()
    loadInsights()
  }, [loadIgConnection, loadStats, loadProfile, loadInsights])

  useEffect(() => {
    if (igConnection?.connected && !igConnection?.expired) {
      loadEngagement()
    }
  }, [igConnection, loadEngagement])

  const insightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="text-green-500" />
      case 'warning': return <AlertCircle size={18} className="text-yellow-500" />
      case 'opportunity': return <Lightbulb size={18} className="text-blue-500" />
      case 'action': return <Target size={18} className="text-purple-500" />
      default: return <Sparkles size={18} className="text-primary" />
    }
  }

  const insightBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900'
      case 'opportunity': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
      case 'action': return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900'
      default: return 'bg-muted border-border'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Instagram Connection Status */}
      {igConnectionLoading ? (
        <ConnectionCardSkeleton />
      ) : igConnection?.connected && !igConnection.expired ? (
        <FadeIn>
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                    <InstagramIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">@{igConnection.username || 'instagram'}</span>
                      <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">Conectado</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Users size={12} /> {(igConnection.followersCount || 0).toLocaleString()} seguidores</span>
                      <span className="flex items-center gap-1"><ImageIcon size={12} /> {igConnection.mediaCount || 0} publicaciones</span>
                      {igEngagementLoading ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : igEngagement !== null ? (
                        <span className="flex items-center gap-1"><TrendingUp size={12} /> {igEngagement.toFixed(1)}% engagement</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <a href="/settings" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ajustes <ExternalLink size={12} />
                </a>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ) : igConnection?.expired ? (
        <FadeIn>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                  <InstagramIcon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">@{igConnection.username || 'instagram'}</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">Token expirado</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Reconecta para seguir viendo estadísticas</p>
                </div>
                <a href="/settings">
                  <Button size="sm" variant="outline" className="gap-1">
                    <AlertTriangle size={14} /> Reconectar
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn>
          <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                  <InstagramIcon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Conecta tu Instagram</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Ve tus estadísticas reales, comentarios y programa publicaciones</p>
                </div>
                <a href="/settings">
                  <Button size="sm" className="gap-1">
                    <InstagramIcon size={14} /> Conectar
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Greeting & Health Score */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">
            ¡Hola, {profile?.displayName || 'Nicola'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Tu asistente de contenido inteligente
          </p>
        </div>

        {healthScore !== null && !insightsLoading && (
          <FadeIn className="flex items-center gap-3">
            <div className="text-center">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4',
                healthScore >= 75 ? 'border-green-500 text-green-600 bg-green-50' :
                healthScore >= 50 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                'border-red-500 text-red-600 bg-red-50'
              )}>
                {healthScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Health Score</p>
            </div>
          </FadeIn>
        )}
      </div>

      {/* Stats Row */}
      {statsLoading ? (
        <StatsRowSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Contenido', value: stats.total, icon: FileText, color: 'text-blue-500' },
            { label: 'Borradores', value: stats.drafts, icon: FileText, color: 'text-yellow-500' },
            { label: 'Programados', value: stats.scheduled, icon: Calendar, color: 'text-purple-500' },
            { label: 'Publicados', value: stats.published, icon: CheckCircle2, color: 'text-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon size={20} className={color} />
                <div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weekly Recommendation */}
      {weeklyRec && !insightsLoading && (
        <FadeIn delay={0.1}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Recomendación Semanal</h3>
                <p className="text-sm text-muted-foreground mt-1">{weeklyRec}</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* AI Insights */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          Insights Inteligentes
        </h2>

        {insightsLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <CardSkeleton key={i} className="h-24" />
            ))}
          </div>
        ) : insights.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {insights.map((insight) => (
              <FadeIn key={insight.id}>
                <Card className={cn('border', insightBg(insight.type))}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {insightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        {insight.metric !== undefined && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {insight.metric} {insight.metricLabel}
                          </Badge>
                        )}
                      </div>
                      {insight.actionLabel && (
                        <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-xs">
                          {insight.actionLabel} <ArrowRight size={12} />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BarChart3 size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Crea contenido y conecta tu Instagram para ver insights inteligentes
            </p>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Crear Post', icon: Sparkles, href: '/create', color: 'bg-primary/10 text-primary' },
            { label: 'Ver Calendario', icon: Calendar, href: '/plan', color: 'bg-purple-50 text-purple-600' },
            { label: 'Ver Insights', icon: TrendingUp, href: '/insights', color: 'bg-blue-50 text-blue-600' },
            { label: 'Programar', icon: Clock, href: '/plan', color: 'bg-green-50 text-green-600' },
          ].map(({ label, icon: Icon, href, color }) => (
            <a key={label} href={href} className="block">
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{label}</span>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}