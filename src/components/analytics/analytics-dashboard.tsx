'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useUIStore } from '@/stores'
import {
  TrendingUp, TrendingDown, Users, Eye, Heart, MessageCircle,
  Share2, Bookmark, BarChart3, Loader2, Plus, X, ExternalLink
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { InstagramIcon } from '@/components/ui/instagram-icon'

interface KPI {
  label: string
  value: string | number
  change?: number
  icon: any
  color: string
  bgColor: string
}

interface PostInsight {
  id: string
  caption: string
  media_type: string
  media_url: string
  permalink: string
  like_count: number
  comments_count: number
  engagement_rate: number
  impressions: number
  reach: number
}

interface Competitor {
  username: string
  followers: number
  avg_likes: number
  avg_comments: number
  engagement_rate: number
}

export function AnalyticsDashboard() {
  const { user } = useAuth()
  const { language } = useUIStore()
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [timeseries, setTimeseries] = useState<any[]>([])
  const [topPosts, setTopPosts] = useState<PostInsight[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [newCompetitor, setNewCompetitor] = useState('')
  const [addingCompetitor, setAddingCompetitor] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const l = {
    title: language === 'de' ? 'Analytics' : language === 'es' ? 'Analíticas' : 'Analytics',
    connect: language === 'de' ? 'Instagram verbinden' : language === 'es' ? 'Conectar Instagram' : 'Connect Instagram',
    connectDesc: language === 'de' ? 'Verbinde Instagram für echte Daten' : language === 'es' ? 'Conecta Instagram para datos reales' : 'Connect Instagram for real analytics',
    followers: language === 'de' ? 'Follower' : language === 'es' ? 'Seguidores' : 'Followers',
    reach: language === 'de' ? 'Reichweite' : language === 'es' ? 'Alcance' : 'Reach',
    impressions: language === 'de' ? 'Impressionen' : language === 'es' ? 'Impresiones' : 'Impressions',
    engagement: language === 'de' ? 'Engagement' : language === 'es' ? 'Engagement' : 'Engagement',
    likes: language === 'de' ? 'Likes' : language === 'es' ? 'Likes' : 'Likes',
    comments: language === 'de' ? 'Kommentare' : language === 'es' ? 'Comentarios' : 'Comments',
    shares: language === 'de' ? 'Geteilt' : language === 'es' ? 'Compartidos' : 'Shares',
    saves: language === 'de' ? 'Gespeichert' : language === 'es' ? 'Guardados' : 'Saves',
    topPosts: language === 'de' ? 'Top Beiträge' : language === 'es' ? 'Top publicaciones' : 'Top Posts',
    competitors: language === 'de' ? 'Wettbewerber' : language === 'es' ? 'Competidores' : 'Competitors',
    addCompetitor: language === 'de' ? 'Hinzufügen' : language === 'es' ? 'Agregar' : 'Add',
    noData: language === 'de' ? 'Keine Daten' : language === 'es' ? 'Sin datos' : 'No data',
    growth: language === 'de' ? 'Wachstum' : language === 'es' ? 'Crecimiento' : 'Growth',
    engRate: language === 'de' ? 'Eng. Rate' : language === 'es' ? 'Tasa Eng.' : 'Eng. Rate',
    viewPost: language === 'de' ? 'Ansehen' : language === 'es' ? 'Ver post' : 'View post',
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: conn } = await supabase
        .from('meta_connections')
        .select('ig_user_id, ig_username, ig_followers_count')
        .eq('user_id', user?.id)
        .single()

      if (conn) {
        setIsConnected(true)
        // Try to load analytics from API
        try {
          const res = await fetch('/api/instagram/analytics?days=30')
          if (res.ok) {
            const data = await res.json()
            processAnalytics(data, conn)
          }
        } catch {}
      }

      // Load competitors from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('brand_voice')
        .eq('user_id', user?.id)
        .single()

      if (profile?.brand_voice) {
        const bv = profile.brand_voice as any
        if (bv.competitors) setCompetitors(bv.competitors)
      }
    } catch {}
    setLoading(false)
  }

  function processAnalytics(data: any, conn: any) {
    const current = data.current || {}
    const previous = data.previous || {}

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0

    setKpis([
      { label: l.followers, value: conn.ig_followers_count?.toLocaleString() || current.followers?.toLocaleString() || '0', change: calcChange(current.followers, previous.followers), icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
      { label: l.reach, value: current.reach?.toLocaleString() || '0', change: calcChange(current.reach, previous.reach), icon: Eye, color: 'text-green-500', bgColor: 'bg-green-500/10' },
      { label: l.impressions, value: current.impressions?.toLocaleString() || '0', change: calcChange(current.impressions, previous.impressions), icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
      { label: l.engagement, value: current.engagement_rate ? `${current.engagement_rate.toFixed(1)}%` : '0%', change: calcChange(current.engagement_rate, previous.engagement_rate), icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    ])

    if (data.timeseries?.length) {
      setTimeseries(data.timeseries)
    }

    if (data.topPosts?.length) {
      setTopPosts(data.topPosts)
    }
  }

  async function addCompetitor() {
    if (!newCompetitor.trim()) return
    setAddingCompetitor(true)
    setError(null)
    try {
      const res = await fetch('/api/instagram/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newCompetitor.trim().replace('@', '') }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setCompetitors([...competitors, {
        username: newCompetitor.trim().replace('@', ''),
        followers: data.data?.followers || 0,
        avg_likes: data.data?.avg_likes || 0,
        avg_comments: data.data?.avg_comments || 0,
        engagement_rate: data.data?.engagement_rate || 0,
      }])
      setNewCompetitor('')
    } catch (err: any) {
      setError(err.message)
    }
    setAddingCompetitor(false)
  }

  async function removeCompetitor(username: string) {
    try {
      await fetch('/api/instagram/competitors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      setCompetitors(competitors.filter((c) => c.username !== username))
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <StaggerItem key={i}>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 ${kpi.bgColor} rounded-xl flex items-center justify-center`}>
                  <kpi.icon size={16} className={kpi.color} />
                </div>
                {kpi.change !== undefined && kpi.change !== 0 && (
                  <span className={`flex items-center gap-0.5 text-xs font-bold ${kpi.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpi.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(kpi.change)}%
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Growth Chart */}
      {timeseries.length > 0 && (
        <FadeIn>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{l.growth}</h3>
              <BarChart3 size={18} className="text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeseries}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#467a49" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#467a49" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="reach" stroke="#467a49" fill="url(#colorReach)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>
      )}

      {/* Top Posts */}
      {topPosts.length > 0 && (
        <FadeIn>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold">{l.topPosts}</h3>
            <div className="space-y-2">
              {topPosts.slice(0, 5).map((post, i) => (
                <div key={post.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.caption || 'Sin caption'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart size={12} />{post.like_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} />{post.comments_count}</span>
                      <span className="text-primary font-bold">{post.engagement_rate}%</span>
                    </div>
                  </div>
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-accent rounded-lg">
                    <ExternalLink size={14} className="text-muted-foreground" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Competitor Analysis */}
      <FadeIn>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{l.competitors}</h3>
            <span className="text-xs text-muted-foreground">{competitors.length}/5</span>
          </div>

          {/* Add competitor */}
          {competitors.length < 5 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="@username"
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              />
              <button
                onClick={addCompetitor}
                disabled={addingCompetitor || !newCompetitor.trim()}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {addingCompetitor ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {competitors.length > 0 ? (
            <div className="space-y-2">
              {competitors.map((comp) => (
                <div key={comp.username} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {comp.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">@{comp.username}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{(comp.followers || 0).toLocaleString()} seg</span>
                      <span className="text-primary font-bold">{comp.engagement_rate || 0}% eng</span>
                    </div>
                  </div>
                  <button onClick={() => removeCompetitor(comp.username)} className="p-1 hover:bg-accent rounded">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{l.noData}</p>
          )}
        </div>
      </FadeIn>
    </div>
  )
}