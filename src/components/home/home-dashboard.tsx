'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/ui/motion'
import {
  Sparkles, Calendar, TrendingUp, AlertCircle, CheckCircle2,
  Lightbulb, ArrowRight, BarChart3, FileText, Clock, Target,
  Users, ImageIcon, ExternalLink, RefreshCw
} from 'lucide-react'
import { InstagramIcon } from '@/components/ui/instagram-icon'
import type { AdvisorInsight } from '@/lib/ai/advisor-engine'

interface IgConnection {
  ig_user_id?: string
  ig_username?: string
  ig_followers_count?: number
  ig_media_count?: number
  isExpired?: boolean
}

interface HomeDashboardProps {
  stats: {
    total: number
    drafts: number
    scheduled: number
    published: number
    thisWeek: number
  }
  contentItems: any[]
  analytics: any[]
  profile: any
  igConnection: IgConnection | null
}

export function HomeDashboard({ stats, contentItems, analytics, profile, igConnection }: HomeDashboardProps) {
  const [insights, setInsights] = useState<AdvisorInsight[]>([])
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [weeklyRec, setWeeklyRec] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [igEngagement, setIgEngagement] = useState<number | null>(null)
  const [igEngagementLoading, setIgEngagementLoading] = useState(false)

  useEffect(() => {
    async function loadInsights() {
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
        setLoading(false)
      }
    }
    loadInsights()
  }, [])

  // Load real engagement rate separately (non-blocking)
  useEffect(() => {
    if (igConnection && !igConnection.isExpired) {
      setIgEngagementLoading(true)
      fetch('/api/instagram/analytics')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.current) setIgEngagement(data.current.engagement_rate)
        })
        .catch(() => {})
        .finally(() => setIgEngagementLoading(false))
    }
  }, [igConnection])

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
      {igConnection ? (
        <FadeIn>
          <Card className={cn(
            'border',
            igConnection.isExpired
              ? 'border-red-200 bg-red-50 dark:bg-red-950/30'
              : 'border-green-200 bg-green-50 dark:bg-green-950/30'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                    <InstagramIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">@{igConnection.ig_username || 'instagram'}</span>
                      {igConnection.isExpired ? (
                        <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">Token expirado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">Conectado</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Users size={12} /> {(igConnection.ig_followers_count || 0).toLocaleString()} seguidores</span>
                      <span className="flex items-center gap-1"><ImageIcon size={12} /> {igConnection.ig_media_count || 0} publicaciones</span>
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
            ¡Hola, {profile?.display_name || 'Nicola'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Tu asistente de contenido inteligente
          </p>
        </div>

        {healthScore !== null && (
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

      {/* Weekly Recommendation */}
      {weeklyRec && (
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

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
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