'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useUIStore } from '@/stores'
import { PILLARS, type ContentPillar } from '@/types'
import {
  Sparkles, Calendar, Lightbulb, RefreshCw, Copy, Check,
  ArrowRight, Wand2, TrendingUp
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

const TRENDING_TOPICS = {
  es: [
    'Autoestima y amor propio',
    'Rutinas matutinas de éxito',
    'Sanación interior',
    'Mindfulness en el trabajo',
    'Gratitud diaria',
    'Crecimiento personal 2026',
    'Resiliencia emocional',
    'Autocuidado sin culpa',
  ],
  de: [
    'Selbstliebe und Akzeptanz',
    'Morgenroutine für Erfolg',
    'Innere Heilung',
    'Achtsamkeit am Arbeitsplatz',
    'Tägliche Dankbarkeit',
    'Persönliche Entwicklung 2026',
    'Emotionale Resilienz',
    'Selfcare ohne schlechtes Gewissen',
  ],
  en: [
    'Self-love and acceptance',
    'Morning success routines',
    'Inner healing journey',
    'Workplace mindfulness',
    'Daily gratitude practice',
    'Personal growth 2026',
    'Emotional resilience',
    'Self-care without guilt',
  ],
}

export function AIContentStudio() {
  const { user } = useAuth()
  const { language } = useUIStore()
  const [activeTab, setActiveTab] = useState<'ideas' | 'calendar' | 'adapt'>('ideas')
  const [selectedPillar, setSelectedPillar] = useState<ContentPillar>('emotional_mastery')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<any[]>([])
  const [calendar, setCalendar] = useState<any[]>([])
  const [adaptedContent, setAdaptedContent] = useState('')
  const [sourceContent, setSourceContent] = useState('')
  const [targetFormat, setTargetFormat] = useState('reel')
  const [trendTopic, setTrendTopic] = useState('')
  const [trendCaption, setTrendCaption] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const l = {
    title: language === 'de' ? 'KI-Content-Studio' : language === 'es' ? 'Estudio IA de Contenido' : 'AI Content Studio',
    ideas: language === 'de' ? 'Ideas' : language === 'es' ? 'Ideas' : 'Ideas',
    calendar: language === 'de' ? 'Wochenplaner' : language === 'es' ? 'Calendario' : 'Weekly Plan',
    adapt: language === 'de' ? 'Anpassen' : language === 'es' ? 'Adaptar' : 'Adapt',
    generate: language === 'de' ? 'Generieren' : language === 'es' ? 'Generar' : 'Generate',
    generating: language === 'de' ? 'Generiere...' : language === 'es' ? 'Generando...' : 'Generating...',
    trendCaption: language === 'de' ? 'Trend-Caption' : language === 'es' ? 'Caption de tendencia' : 'Trend Caption',
    selectPillar: language === 'de' ? 'Säule wählen' : language === 'es' ? 'Elige pilar' : 'Select pillar',
    format: language === 'de' ? 'Format' : language === 'es' ? 'Formato' : 'Format',
    hook: language === 'de' ? 'Hook' : language === 'es' ? 'Hook' : 'Hook',
    description: language === 'de' ? 'Beschreibung' : language === 'es' ? 'Descripción' : 'Description',
    cta: language === 'de' ? 'CTA' : language === 'es' ? 'CTA' : 'CTA',
    bestTime: language === 'de' ? 'Beste Zeit' : language === 'es' ? 'Mejor hora' : 'Best time',
    sourceContent: language === 'de' ? 'Quellinhalt' : language === 'es' ? 'Contenido original' : 'Source content',
    targetFormat: language === 'de' ? 'Zielformat' : language === 'es' ? 'Formato destino' : 'Target format',
    adaptContent: language === 'de' ? 'Anpassen' : language === 'es' ? 'Adaptar' : 'Adapt content',
    saveToCalendar: language === 'de' ? 'Im Kalender speichern' : language === 'es' ? 'Guardar en calendario' : 'Save to calendar',
  }

  async function generateIdeas() {
    setLoading(true)
    setIdeas([])
    try {
      const res = await fetch('/api/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ideas',
          language,
          pillar: selectedPillar,
        }),
      })
      const data = await res.json()
      setIdeas(data.ideas || [])
    } catch {}
    setLoading(false)
  }

  async function generateCalendar() {
    setLoading(true)
    setCalendar([])
    try {
      const res = await fetch('/api/ai/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          pillars: [selectedPillar],
        }),
      })
      const data = await res.json()
      setCalendar(data.calendar || [])
    } catch {}
    setLoading(false)
  }

  async function adaptContent() {
    if (!sourceContent.trim()) return
    setLoading(true)
    setAdaptedContent('')
    try {
      const res = await fetch('/api/ai/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceContent,
          sourceFormat: 'post',
          targetFormat,
          language,
        }),
      })
      const data = await res.json()
      setAdaptedContent(data.content || '')
    } catch {}
    setLoading(false)
  }

  async function generateTrendCaption() {
    if (!trendTopic.trim()) return
    setLoading(true)
    setTrendCaption('')
    try {
      const res = await fetch('/api/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trend_caption',
          language,
          pillar: selectedPillar,
          trend: trendTopic,
        }),
      })
      const data = await res.json()
      setTrendCaption(data.caption || '')
    } catch {}
    setLoading(false)
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatEmoji: Record<string, string> = {
    post: '📝', reel: '🎬', story: '💡', carousel: '📊',
  }

  const timeLabels: Record<string, string> = {
    morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙',
    mañana: '🌅', mediodía: '☀️', tarde: '🌆', noche: '🌙',
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
        {(['ideas', 'calendar', 'adapt'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ideas' && <><Lightbulb size={14} /> {l.ideas}</>}
            {tab === 'calendar' && <><Calendar size={14} /> {l.calendar}</>}
            {tab === 'adapt' && <><Wand2 size={14} /> {l.adapt}</>}
          </button>
        ))}
      </div>

      {/* Pillar selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(PILLARS) as [ContentPillar, typeof PILLARS[ContentPillar]][]).map(([key, pillar]) => (
          <button
            key={key}
            onClick={() => setSelectedPillar(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedPillar === key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {pillar.emoji} {pillar.name}
          </button>
        ))}
      </div>

      {/* IDEAS TAB */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          {/* Trend caption */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <span className="font-bold text-sm">{l.trendCaption}</span>
            </div>
            <div className="flex gap-2">
              <select
                value={trendTopic}
                onChange={(e) => setTrendTopic(e.target.value)}
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none"
              >
                <option value="">{l.selectPillar}...</option>
                {(TRENDING_TOPICS[language as keyof typeof TRENDING_TOPICS] || TRENDING_TOPICS.es).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={generateTrendCaption}
                disabled={loading || !trendTopic}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              </button>
            </div>
            {trendCaption && (
              <FadeIn>
                <div className="p-3 bg-muted rounded-xl text-sm whitespace-pre-wrap">
                  {trendCaption}
                  <button onClick={() => copyToClipboard(trendCaption, 'trend')} className="float-right ml-2 p-1 hover:bg-accent rounded">
                    {copied === 'trend' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                  </button>
                </div>
              </FadeIn>
            )}
          </div>

          {/* Generate ideas */}
          <button
            onClick={generateIdeas}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Lightbulb size={16} />}
            {loading ? l.generating : l.generate}
          </button>

          {/* Ideas list */}
          {ideas.length > 0 && (
            <StaggerContainer className="space-y-3">
              {ideas.map((idea, i) => (
                <StaggerItem key={i}>
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{formatEmoji[idea.formato || idea.format || 'post'] || '📝'}</span>
                        <h4 className="font-bold text-sm">{idea.titulo || idea.title}</h4>
                      </div>
                      <button onClick={() => copyToClipboard(JSON.stringify(idea), `idea-${i}`)} className="p-1 hover:bg-accent rounded">
                        {copied === `idea-${i}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </button>
                    </div>
                    {((idea.hook || idea.Hook) && (
                      <p className="text-sm text-primary font-medium">"{idea.hook || idea.Hook}"</p>
                    ))}
                    <p className="text-sm text-muted-foreground">{idea.descripcion || idea.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(idea.hashtags || []).length > 0 && (
                        <span className="text-primary">{(idea.hashtags || []).slice(0, 5).join(' ')}</span>
                      )}
                      {idea.cta && <span>• CTA: {idea.cta}</span>}
                      {idea.best_time && <span>• {timeLabels[idea.best_time] || ''} {idea.best_time}</span>}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <button
            onClick={generateCalendar}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Calendar size={16} />}
            {loading ? l.generating : l.calendar}
          </button>

          {calendar.length > 0 && (
            <StaggerContainer className="space-y-2">
              {calendar.map((item, i) => (
                <StaggerItem key={i}>
                  <div className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary uppercase">{item.dia || item.day}</span>
                      <span className="text-xs text-muted-foreground">{item.hora || item.time}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{formatEmoji[item.formato || item.format || 'post'] || '📝'} {item.formato || item.format || 'post'}</span>
                    </div>
                    <h4 className="font-bold text-sm">{item.titulo || item.title}</h4>
                    {(item.caption || item.texto) && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.caption || item.texto}</p>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      )}

      {/* ADAPT TAB */}
      {activeTab === 'adapt' && (
        <div className="space-y-4">
          <textarea
            value={sourceContent}
            onChange={(e) => setSourceContent(e.target.value)}
            placeholder={l.sourceContent}
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none resize-none"
            rows={4}
          />
          <div className="flex gap-2">
            {['reel', 'story', 'carousel'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTargetFormat(fmt)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  targetFormat === fmt ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {formatEmoji[fmt]} {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={adaptContent}
            disabled={loading || !sourceContent.trim()}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {l.adaptContent}
          </button>

          {adaptedContent && (
            <FadeIn>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{targetFormat.toUpperCase()}</span>
                  <button onClick={() => copyToClipboard(adaptedContent, 'adapt')} className="p-1 hover:bg-accent rounded">
                    {copied === 'adapt' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{adaptedContent}</p>
              </div>
            </FadeIn>
          )}
        </div>
      )}
    </div>
  )
}