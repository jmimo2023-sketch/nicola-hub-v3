'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  List, Plus, Clock, Sparkles, LayoutGrid
} from 'lucide-react'
import { FadeIn } from '@/components/ui/motion'
import { InstagramIcon } from '@/components/ui/instagram-icon'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────

interface CalendarContent {
  id: string
  title: string
  type: 'post' | 'reel' | 'story' | 'carousel' | 'video'
  pillar: string
  status: 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed'
  scheduledDate: string | null
  scheduledTime: string | null
  caption: string
  hashtags: string[]
}

// ── Status Colors ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  idea: { color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', label: '💡 Idea' },
  draft: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', label: '📝 Draft' },
  review: { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950', label: '👀 Review' },
  approved: { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', label: '✅ Approved' },
  scheduled: { color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', label: '📅 Scheduled' },
  published: { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', label: '🚀 Published' },
  failed: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', label: '❌ Failed' },
}

const TYPE_ICONS: Record<string, string> = {
  post: '📸',
  reel: '🎬',
  story: '📱',
  carousel: '🎠',
  video: '🎥',
}

const PILLAR_EMOJIS: Record<string, string> = {
  emotional_mastery: '💜',
  systematic_method: '🔧',
  valley_experience: '🏔️',
  transformation: '🦋',
  community: '🤝',
}

// ── Mock data for demo ─────────────────────────────────────────────────────

function getMockContent(): CalendarContent[] {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  return [
    {
      id: '1', title: 'Vulnerabilidad como fortaleza', type: 'post',
      pillar: 'emotional_mastery', status: 'scheduled',
      scheduledDate: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
      scheduledTime: '12:00', caption: 'Hoy quiero hablarles de algo...', hashtags: ['#vulnerabilidad']
    },
    {
      id: '2', title: '5 Pasos para transformar tu vida', type: 'carousel',
      pillar: 'systematic_method', status: 'draft',
      scheduledDate: null, scheduledTime: null, caption: 'Slide 1: Reconoce...', hashtags: ['#transformación']
    },
    {
      id: '3', title: 'Mi historia de valle', type: 'reel',
      pillar: 'valley_experience', status: 'approved',
      scheduledDate: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)),
      scheduledTime: '19:00', caption: 'Hubo un momento...', hashtags: ['#resiliencia']
    },
    {
      id: '4', title: 'Before & After: Mi journey', type: 'story',
      pillar: 'transformation', status: 'published',
      scheduledDate: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
      scheduledTime: '18:00', caption: 'Swipe para ver...', hashtags: ['#transformación']
    },
    {
      id: '5', title: 'Comunidad: Tu no estás solo/a', type: 'post',
      pillar: 'community', status: 'review',
      scheduledDate: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5)),
      scheduledTime: '09:00', caption: 'Quiero que sepas...', hashtags: ['#comunidad']
    },
  ]
}

// ── Calendar Day Cell ──────────────────────────────────────────────────────

function CalendarDayCell({
  date,
  content,
  isToday,
  isCurrentMonth,
  onClick,
}: {
  date: Date
  content: CalendarContent[]
  isToday: boolean
  isCurrentMonth: boolean
  onClick: (date: Date) => void
}) {
  return (
    <div
      className={cn(
        'min-h-[120px] p-1.5 border border-border/50 rounded-lg transition-colors cursor-pointer hover:bg-accent/50',
        !isCurrentMonth && 'opacity-40',
        isToday && 'ring-2 ring-primary/50 bg-primary/5',
      )}
      onClick={() => onClick(date)}
    >
      <div className={cn(
        'text-xs font-semibold mb-1',
        isToday ? 'text-primary' : 'text-muted-foreground'
      )}>
        {date.getDate()}
      </div>
      <div className="space-y-1">
        {content.slice(0, 3).map((item) => {
          const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft
          return (
            <div
              key={item.id}
              className={cn(
                'text-[10px] leading-tight px-1 py-0.5 rounded truncate',
                config.bg, config.color
              )}
              title={item.title}
            >
              {TYPE_ICONS[item.type] || '📄'} {item.title}
            </div>
          )
        })}
        {content.length > 3 && (
          <div className="text-[10px] text-muted-foreground text-center">
            +{content.length - 3} más
          </div>
        )}
      </div>
    </div>
  )
}

// ── Queue Item ──────────────────────────────────────────────────────────────

function QueueItem({ item, igConnected, onPublish }: { item: CalendarContent; igConnected?: boolean; onPublish?: (item: CalendarContent) => void }) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft
  const canPublish = igConnected && (item.status === 'approved' || item.status === 'scheduled')
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl border border-border/50', config.bg)}>
      <span className="text-lg">{TYPE_ICONS[item.type] || '📄'}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.title}</div>
        <div className="text-xs text-muted-foreground">
          {PILLAR_EMOJIS[item.pillar] || '📌'} {item.scheduledTime || 'Sin hora'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canPublish && onPublish && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onPublish(item)}>
            Publicar
          </Button>
        )}
        <Badge variant="outline" className={cn('text-[10px]', config.color)}>
          {config.label}
        </Badge>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

interface ContentCalendarProps {
  igConnected?: boolean
}

export function ContentCalendar() {
  const t = useTranslations()
  const [igConnected, setIgConnected] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const content = useMemo(() => getMockContent(), [])

  // Check IG connection client-side (non-blocking)
  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: conn } = await supabase
          .from('meta_connections')
          .select('expires_at')
          .eq('user_id', user.id)
          .single()
        if (conn && new Date(conn.expires_at) > new Date()) {
          setIgConnected(true)
        }
      } catch {}
    }
    checkConnection()
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay() // 0=Sun
    const daysInMonth = lastDay.getDate()

    const days: Date[] = []

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    // Next month padding (fill to 6 rows)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }, [year, month])

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const today = new Date()
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()

  const contentForDate = (d: Date) => {
    const dateStr = d.toISOString().split('T')[0]
    return content.filter(c => c.scheduledDate === dateStr)
  }

  const scheduledItems = content
    .filter(c => c.status === 'scheduled' || c.status === 'approved')
    .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''))

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1))
  }

  const handlePublish = async (item: CalendarContent) => {
    if (!igConnected) {
      toast.error('Conecta Instagram para publicar')
      return
    }
    toast.promise(
      fetch('/api/scheduling/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId: item.id }),
      }).then(async (res) => {
        if (!res.ok) throw new Error('Error al publicar')
        return res.json()
      }),
      {
        loading: `Publicando "${item.title}"...`,
        success: `"${item.title}" publicado exitosamente`,
        error: 'Error al publicar. Intenta de nuevo.',
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <CalendarIcon size={28} className="text-primary" />
            Calendario de Contenido
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planifica, programa y visualiza tu contenido
          </p>
          {igConnected ? (
            <Badge variant="outline" className="mt-1 text-[10px] text-green-600 border-green-300 flex items-center gap-1 w-fit">
              <InstagramIcon size={10} className="text-green-600" /> Instagram conectado — puedes publicar directamente
            </Badge>
          ) : (
            <Badge variant="outline" className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1 w-fit">
              <InstagramIcon size={10} /> Instagram no conectado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold min-w-[160px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="month">
              <CalendarIcon size={14} className="mr-1" /> Mes
            </TabsTrigger>
            <TabsTrigger value="week">
              <LayoutGrid size={14} className="mr-1" /> Semana
            </TabsTrigger>
            <TabsTrigger value="list">
              <List size={14} className="mr-1" /> Lista
            </TabsTrigger>
          </TabsList>

          <Button size="sm" className="gap-1" onClick={() => toast.info('Redirigiendo al creador de contenido...')}>
            <Plus size={14} /> Nuevo Post
          </Button>
        </div>

        {/* Month View */}
        <TabsContent value="month" className="mt-4">
          <FadeIn>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map(day => (
                <div key={day} className="text-xs text-center font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dayContent = contentForDate(day)
                const isCurrentMonth = day.getMonth() === month

                return (
                  <CalendarDayCell
                    key={i}
                    date={day}
                    content={dayContent}
                    isToday={isToday(day)}
                    isCurrentMonth={isCurrentMonth}
                    onClick={(d) => setSelectedDate(d)}
                  />
                )
              })}
            </div>
          </FadeIn>
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week" className="mt-4">
          <FadeIn>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(currentDate)
                const startOfWeek = new Date(currentDate)
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + i)
                const dayContent = contentForDate(startOfWeek)

                return (
                  <div key={i} className="space-y-2">
                    <div className={cn(
                      'text-center text-sm font-medium py-2 rounded-lg',
                      isToday(startOfWeek) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {dayNames[startOfWeek.getDay()]} {startOfWeek.getDate()}
                    </div>
                    {dayContent.length > 0 ? (
                      dayContent.map(item => (
                        <QueueItem key={item.id} item={item} igConnected={igConnected} onPublish={handlePublish} />
                      ))
                    ) : (
                      <div className="text-xs text-center text-muted-foreground py-4 border border-dashed border-border/50 rounded-lg">
                        Sin contenido
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </FadeIn>
        </TabsContent>

        {/* List View — Publishing Queue */}
        <TabsContent value="list" className="mt-4">
          <FadeIn>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock size={16} /> Cola de Publicación
              </h3>
              <Badge variant="outline">
                {scheduledItems.length} pendientes
              </Badge>
            </div>

            {scheduledItems.length > 0 ? (
              <div className="space-y-2">
                {scheduledItems.map(item => (
                  <QueueItem key={item.id} item={item} igConnected={igConnected} onPublish={handlePublish} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <CalendarIcon size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay contenido programado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea contenido y prográmalo desde el Calendario
                </p>
              </Card>
            )}
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-2 pt-2">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className={cn('text-xs px-2 py-1 rounded-md', config.bg, config.color)}>
            {config.label}
          </div>
        ))}
      </div>
    </div>
  )
}