'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PILLARS, type ContentPillar } from '@/types'
import {
  BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle,
  Share2, Bookmark, Sparkles, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

interface InsightData {
  contentHealthScore: number
  insights: Array<{
    id: string
    type: 'success' | 'warning' | 'opportunity' | 'action'
    category: string
    title: string
    description: string
    metric?: number
    metricLabel?: string
    actionLabel?: string
    priority: string
  }>
  weeklyRecommendation: string
  optimalPostCount: { min: number; max: number; current: number }
}

// ── Mock chart data ──────────────────────────────────────────────────────────

const engagementData = [
  { date: 'Lun', likes: 45, comments: 12, shares: 8, saves: 15, reach: 1200 },
  { date: 'Mar', likes: 62, comments: 18, shares: 12, saves: 22, reach: 1800 },
  { date: 'Mié', likes: 38, comments: 9, shares: 6, saves: 11, reach: 950 },
  { date: 'Jue', likes: 71, comments: 22, shares: 15, saves: 28, reach: 2200 },
  { date: 'Vie', likes: 55, comments: 16, shares: 10, saves: 19, reach: 1500 },
  { date: 'Sáb', likes: 82, comments: 25, shares: 18, saves: 32, reach: 2600 },
  { date: 'Dom', likes: 48, comments: 14, shares: 9, saves: 14, reach: 1100 },
]

const pillarData = Object.entries(PILLARS).map(([key, pillar]) => ({
  name: pillar.name,
  value: Math.floor(Math.random() * 30) + 10,
  color: pillar.color,
}))

const COLORS = Object.values(PILLARS).map(p => p.color)

const topPosts = [
  { title: 'Vulnerabilidad como fortaleza', type: 'post', likes: 156, comments: 42, reach: 4200, engagement: 4.7 },
  { title: '5 Pasos para transformar tu vida', type: 'carousel', likes: 134, comments: 38, reach: 3800, engagement: 4.5 },
  { title: 'Mi historia de valle', type: 'reel', likes: 210, comments: 51, reach: 5200, engagement: 5.0 },
  { title: 'Comunidad: Tú no estás solo/a', type: 'post', likes: 98, comments: 29, reach: 2800, engagement: 4.5 },
  { title: 'Before & After: Mi journey', type: 'story', likes: 89, comments: 22, reach: 2100, engagement: 5.3 },
]

// ── Component ────────────────────────────────────────────────────────────────

export function SmartInsights() {
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await fetch('/api/insights/recommendations')
        if (res.ok) {
          const data = await res.json()
          setInsightData(data)
        }
      } catch (e) {
        console.error('[Insights] Error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadInsights()
  }, [])

  const healthScore = insightData?.contentHealthScore ?? 0
  const insights = insightData?.insights ?? []
  const weeklyRec = insightData?.weeklyRecommendation ?? ''
  const postCount = insightData?.optimalPostCount ?? { min: 3, max: 5, current: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BarChart3 size={28} className="text-primary" />
            Insights Pro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis inteligente con recomendaciones IA
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw size={14} /> Actualizar
        </Button>
      </div>

      {/* Health Score + Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Health Score */}
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4',
              healthScore >= 75 ? 'border-green-500 text-green-600 bg-green-50' :
              healthScore >= 50 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
              'border-red-500 text-red-600 bg-red-50'
            )}>
              {healthScore || '—'}
            </div>
            <p className="text-xs font-medium mt-2">Health Score</p>
            <p className="text-[10px] text-muted-foreground">Salud del contenido</p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {[
          { label: 'Alcance semanal', value: '12.5K', change: '+18%', up: true, icon: Eye },
          { label: 'Engagement rate', value: '4.8%', change: '+0.5%', up: true, icon: Heart },
          { label: 'Nuevos seguidores', value: '+243', change: '+12%', up: true, icon: Users },
          { label: 'Guardados', value: '141', change: '+32%', up: true, icon: Bookmark },
        ].map(({ label, value, change, up, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Icon size={16} className="text-muted-foreground" />
                <span className={cn('text-xs font-medium flex items-center gap-0.5', up ? 'text-green-600' : 'text-red-600')}>
                  {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {change}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Recommendation */}
      {weeklyRec && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Recomendación IA de esta semana</h3>
              <p className="text-sm text-muted-foreground mt-1">{weeklyRec}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pillars">Pilares</TabsTrigger>
          <TabsTrigger value="top">Top Posts</TabsTrigger>
          <TabsTrigger value="ai">IA Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Engagement semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="reach" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} name="Alcance" />
                    <Area type="monotone" dataKey="likes" stroke="#EC4899" fill="#EC4899" fillOpacity={0.1} name="Likes" />
                    <Area type="monotone" dataKey="comments" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} name="Comments" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { type: 'Posts', engagement: 4.2, count: 12 },
                    { type: 'Reels', engagement: 5.1, count: 8 },
                    { type: 'Stories', engagement: 3.8, count: 15 },
                    { type: 'Carousel', engagement: 4.7, count: 6 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="type" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }} />
                    <Bar dataKey="engagement" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Engagement %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Posting Frequency */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Frecuencia de publicación</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta semana: {postCount.current} posts · Óptimo: {postCount.min}-{postCount.max}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-32 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        postCount.current >= postCount.min ? 'bg-green-500' : 'bg-yellow-500'
                      )}
                      style={{ width: `${Math.min(100, (postCount.current / postCount.max) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{postCount.current}/{postCount.max}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pillars Tab */}
        <TabsContent value="pillars" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Pilar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pillarData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                      {pillarData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {Object.entries(PILLARS).map(([key, pillar]) => (
                <Card key={key}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-2xl">{pillar.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{pillar.name}</div>
                      <div className="text-xs text-muted-foreground">{pillar.description.es}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{Math.floor(Math.random() * 30) + 10}%</div>
                      <div className="text-[10px] text-muted-foreground">engagement</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Top Posts Tab */}
        <TabsContent value="top" className="space-y-3">
          {topPosts.map((post, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{post.title}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{post.type}</span>
                    <span className="flex items-center gap-0.5"><Heart size={10} /> {post.likes}</span>
                    <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {post.comments}</span>
                    <span className="flex items-center gap-0.5"><Eye size={10} /> {(post.reach / 1000).toFixed(1)}K</span>
                  </div>
                </div>
                <Badge className={post.engagement >= 5 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                  {post.engagement}% eng
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai" className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : insights.length > 0 ? (
            insights.map((insight) => {
              const typeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
                success: { color: 'border-green-200 bg-green-50 dark:bg-green-950/30', icon: <TrendingUp size={18} className="text-green-500" /> },
                warning: { color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30', icon: <MessageCircle size={18} className="text-yellow-500" /> },
                opportunity: { color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/30', icon: <Sparkles size={18} className="text-blue-500" /> },
                action: { color: 'border-purple-200 bg-purple-50 dark:bg-purple-950/30', icon: <Share2 size={18} className="text-purple-500" /> },
              }
              const config = typeConfig[insight.type] || typeConfig.action

              return (
                <Card key={insight.id} className={cn('border', config.color)}>
                  <CardContent className="p-4 flex items-start gap-3">
                    {config.icon}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {insight.metric !== undefined && (
                          <Badge variant="outline" className="text-xs">{insight.metric} {insight.metricLabel}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      {insight.actionLabel && (
                        <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs gap-1">
                          {insight.actionLabel} <ArrowUpRight size={10} />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="p-8 text-center">
              <Sparkles size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Crea contenido y conecta Instagram para ver insights IA</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}