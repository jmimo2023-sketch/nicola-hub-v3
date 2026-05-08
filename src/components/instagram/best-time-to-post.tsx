'use client'

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, Info } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

interface TimeSlot {
  day: string
  hour: number
  score: number
}

const dayLabels: Record<string, Record<string, string>> = {
  es: { Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom' },
  de: { Mon: 'Mo', Tue: 'Di', Wed: 'Mi', Thu: 'Do', Fri: 'Fr', Sat: 'Sa', Sun: 'So' },
  en: { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' },
}

export function BestTimeToPost({ language, isConnected }: { language: string; isConnected: boolean }) {
  const [times, setTimes] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const labels = {
    title: language === 'de' ? 'Beste Postzeiten' : language === 'es' ? 'Mejor hora para publicar' : 'Best Time to Post',
    subtitle: language === 'de' ? 'Basierend auf deiner Zielgruppe' : language === 'es' ? 'Basado en tu audiencia' : 'Based on your audience activity',
    connect: language === 'de' ? 'Verbinde Instagram für echte Daten' : language === 'es' ? 'Conecta Instagram para datos reales' : 'Connect Instagram for real data',
    usingDefault: language === 'de' ? 'Verwendet Standardzeiten' : language === 'es' ? 'Usando horarios generales' : 'Using general best times',
  }

  useEffect(() => {
    loadBestTimes()
  }, [isConnected])

  async function loadBestTimes() {
    setLoading(true)
    try {
      if (isConnected) {
        const res = await fetch('/api/instagram/best-times')
        if (res.ok) {
          const data = await res.json()
          setTimes(data.times || data)
          setLoading(false)
          return
        }
      }
      // Default times
      setTimes(getDefaultTimes())
    } catch {
      setTimes(getDefaultTimes())
    }
    setLoading(false)
  }

  function getDefaultTimes(): TimeSlot[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const bestHours = [9, 12, 18, 21]
    return days.flatMap((day) =>
      bestHours.map((hour, i) => ({
        day,
        hour,
        score: 100 - i * 20,
      }))
    )
  }

  const maxScore = Math.max(...times.map((t) => t.score), 1)
  const localizedDays = dayLabels[language] || dayLabels.en

  // Group by day for grid view
  const groupedByDay: Record<string, TimeSlot[]> = {}
  times.forEach((t) => {
    if (!groupedByDay[t.day]) groupedByDay[t.day] = []
    groupedByDay[t.day].push(t)
  })

  // Top 5 for list view
  const topTimes = [...times].sort((a, b) => b.score - a.score).slice(0, 7)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          <h3 className="font-bold">{labels.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('grid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${view === 'list' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
          >
            Top
          </button>
        </div>
      </div>

      {!isConnected && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500">
          <Info size={14} />
          {labels.usingDefault}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Cargando...</div>
      ) : view === 'grid' ? (
        <FadeIn>
          <div className="space-y-2">
            {Object.entries(groupedByDay).map(([day, slots]) => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-8 text-xs font-bold text-muted-foreground">{localizedDays[day] || day}</span>
                <div className="flex-1 flex items-center gap-1">
                  {slots
                    .sort((a, b) => a.hour - b.hour)
                    .map((slot, i) => {
                      const intensity = (slot.score / maxScore) * 100
                      return (
                        <div
                          key={i}
                          className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-default"
                          style={{
                            backgroundColor: `rgba(70, 122, 73, ${intensity / 150})`,
                            color: intensity > 50 ? 'white' : 'var(--color-muted-foreground)',
                          }}
                          title={`${slot.hour}:00 — Score: ${slot.score}`}
                        >
                          {slot.hour}
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      ) : (
        <FadeIn>
          <StaggerContainer className="space-y-2">
            {topTimes.map((slot, i) => (
              <StaggerItem key={i}>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm">
                      {localizedDays[slot.day] || slot.day} · {slot.hour}:00
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-xs font-bold text-primary">{Math.round((slot.score / maxScore) * 100)}%</span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      )}
    </div>
  )
}