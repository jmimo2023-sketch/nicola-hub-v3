'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useUIStore } from '@/stores'
import {
  Ear, AlertTriangle, TrendingUp, Sparkles, Plus, X, RefreshCw,
  Heart, ThumbsDown, Minus, MessageCircle, Search, Loader2
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { InstagramIcon } from '@/components/ui/instagram-icon'

interface Mention {
  id: string
  type: string
  text: string
  sender: string
  timestamp: string
  matchedKeywords: string[]
  sentiment: { label: string; score: number; emotions: string[] }
  media: { caption: string; permalink: string } | null
}

interface Alert {
  type: 'crisis' | 'trend' | 'opportunity'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  count: number
}

interface Trend {
  nombre?: string
  name?: string
  descripcion?: string
  description?: string
  hashtags?: string[]
  tipo?: string
  type?: string
  urgencia?: string
  urgency?: string
  pilar?: string
  pillar?: string
}

const sentimentIcons = {
  positive: { icon: Heart, color: 'text-green-500', bg: 'bg-green-500/10' },
  negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-500/10' },
  neutral: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
  mixed: { icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
}

const alertIcons = {
  crisis: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  trend: { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  opportunity: { icon: Sparkles, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
}

export function SocialListeningPage() {
  const { user } = useAuth()
  const { language } = useUIStore()
  const [mentions, setMentions] = useState<Mention[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [trends, setTrends] = useState<Trend[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<'mentions' | 'alerts' | 'trends'>('mentions')

  const l = {
    title: language === 'de' ? 'Social Listening' : language === 'es' ? 'Escucha Social' : 'Social Listening',
    subtitle: language === 'de' ? 'Markenmentions und Sentiment' : language === 'es' ? 'Menciones de marca y sentimiento' : 'Brand mentions and sentiment',
    mentions: language === 'de' ? 'Erwähnungen' : language === 'es' ? 'Menciones' : 'Mentions',
    alerts: language === 'es' ? 'Alertas' : 'Alerts',
    trends: language === 'de' ? 'Trends' : language === 'es' ? 'Tendencias' : 'Trends',
    keywords: language === 'de' ? 'Schlüsselwörter' : language === 'es' ? 'Palabras clave' : 'Keywords',
    addKeyword: language === 'de' ? 'Hinzufügen' : language === 'es' ? 'Agregar' : 'Add',
    noConnection: language === 'de' ? 'Instagram nicht verbunden' : language === 'es' ? 'Instagram no conectado' : 'Instagram not connected',
    connect: language === 'de' ? 'Verbinde Instagram in den Einstellungen' : language === 'es' ? 'Conecta Instagram en Ajustes' : 'Connect Instagram in Settings',
    noMentions: language === 'de' ? 'Keine Erwähnungen gefunden' : language === 'es' ? 'Sin menciones' : 'No mentions found',
    discover: language === 'de' ? 'Trends entdecken' : language === 'es' ? 'Descubrir tendencias' : 'Discover Trends',
    discovering: language === 'de' ? 'Entdecke...' : language === 'es' ? 'Descubriendo...' : 'Discovering...',
    positive: language === 'de' ? 'Positiv' : 'Positivo',
    negative: language === 'de' ? 'Negativ' : 'Negativo',
    neutral: language === 'de' ? 'Neutral' : 'Neutral',
    mixed: language === 'de' ? 'Gemischt' : 'Mixto',
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: conn } = await supabase
      .from('meta_connections')
      .select('ig_user_id')
      .eq('user_id', user?.id)
      .single()

    setIsConnected(!!conn)

    // Load keywords
    const { data: profile } = await supabase
      .from('profiles')
      .select('brand_voice')
      .eq('user_id', user?.id)
      .single()

    const bv = (profile?.brand_voice as any) || {}
    setKeywords(bv.listening_keywords || ['yoga', 'mindfulness', 'coaching', 'meditación', 'espiritualidad'])

    if (conn) {
      try {
        const res = await fetch('/api/ai/listening')
        if (res.ok) {
          const data = await res.json()
          setMentions(data.mentions || [])
          setAlerts(data.alerts || [])
        }
      } catch {}
    }
    setLoading(false)
  }

  async function addKeyword() {
    if (!newKeyword.trim() || keywords.length >= 10) return
    const updated = [...keywords, newKeyword.trim().toLowerCase()]
    setKeywords(updated)
    setNewKeyword('')
    await fetch('/api/ai/keywords', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: updated }),
    })
  }

  async function removeKeyword(kw: string) {
    const updated = keywords.filter(k => k !== kw)
    setKeywords(updated)
    await fetch('/api/ai/keywords', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: updated }),
    })
  }

  async function discoverTrends() {
    setLoadingTrends(true)
    try {
      const res = await fetch('/api/ai/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      })
      const data = await res.json()
      setTrends(data.trends || [])
    } catch {}
    setLoadingTrends(false)
  }

  const sentimentLabel = (label: string) => {
    const map: Record<string, string> = { positive: l.positive, negative: l.negative, neutral: l.neutral, mixed: l.mixed }
    return map[label] || label
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Ear size={24} className="text-primary" />
          {l.title}
        </h1>
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mx-auto">
            <InstagramIcon size={28} className="text-white" />
          </div>
          <h3 className="font-bold">{l.noConnection}</h3>
          <p className="text-sm text-muted-foreground">{l.connect}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Ear size={24} className="text-primary" />
          {l.title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{l.subtitle}</p>
      </div>

      {/* Keywords */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-primary" />
            <span className="font-bold text-sm">{l.keywords}</span>
          </div>
          <span className="text-xs text-muted-foreground">{keywords.length}/10</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span key={kw} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm font-medium text-primary flex items-center gap-1.5">
              {kw}
              <button onClick={() => removeKeyword(kw)} className="hover:bg-primary/20 rounded-full p-0.5">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        {keywords.length < 10 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              placeholder={language === 'de' ? 'Neues Schlüsselwort...' : language === 'es' ? 'Nueva palabra clave...' : 'New keyword...'}
              className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none"
            />
            <button onClick={addKeyword} className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary-dark transition-colors">
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
        {(['mentions', 'alerts', 'trends'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'mentions' && l.mentions}
            {tab === 'alerts' && `${l.alerts} ${alerts.length > 0 ? `(${alerts.length})` : ''}`}
            {tab === 'trends' && l.trends}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : activeTab === 'mentions' ? (
        <div className="space-y-2">
          {mentions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle size={32} className="mx-auto mb-3" />
              <p className="text-sm">{l.noMentions}</p>
            </div>
          ) : (
            <StaggerContainer className="space-y-2">
              {mentions.map((m) => {
                const s = sentimentIcons[m.sentiment?.label as keyof typeof sentimentIcons] || sentimentIcons.neutral
                const SentimentIcon = s.icon
                return (
                  <StaggerItem key={m.id}>
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                          <SentimentIcon size={14} className={s.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{m.sender}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{sentimentLabel(m.sentiment?.label || 'neutral')}</span>
                          </div>
                          <p className="text-sm">{m.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {m.matchedKeywords?.map((kw) => (
                              <span key={kw} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{kw}</span>
                            ))}
                            {m.sentiment?.emotions?.map((e) => (
                              <span key={e} className="text-xs text-muted-foreground">{e}</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(m.timestamp).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </div>
      ) : activeTab === 'alerts' ? (
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle size={32} className="mx-auto mb-3" />
              <p className="text-sm">{language === 'de' ? 'Keine Warnungen' : language === 'es' ? 'Sin alertas' : 'No alerts'}</p>
            </div>
          ) : (
            alerts.map((alert, i) => {
              const a = alertIcons[alert.type]
              const AlertIcon = a.icon
              return (
                <FadeIn key={i}>
                  <div className={`p-4 rounded-xl border ${a.border} ${a.bg}`}>
                    <div className="flex items-start gap-3">
                      <AlertIcon size={20} className={a.color} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{alert.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            alert.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                            alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-green-500/10 text-green-500'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground">{alert.count}</span>
                    </div>
                  </div>
                </FadeIn>
              )
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={discoverTrends}
            disabled={loadingTrends}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingTrends ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            {loadingTrends ? l.discovering : l.discover}
          </button>

          {trends.length > 0 && (
            <StaggerContainer className="space-y-2">
              {trends.map((trend, i) => (
                <StaggerItem key={i}>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm">{trend.nombre || trend.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        (trend.urgencia || trend.urgency) === 'alta' ? 'bg-red-500/10 text-red-500' :
                        (trend.urgencia || trend.urgency) === 'media' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {trend.urgencia || trend.urgency || 'media'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{trend.descripcion || trend.description}</p>
                    {(trend.hashtags && trend.hashtags.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {trend.hashtags.map((h) => (
                          <span key={h} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{h.startsWith('#') ? h : `#${h}`}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      )}
    </div>
  )
}