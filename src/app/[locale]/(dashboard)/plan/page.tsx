import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PILLARS } from '@/types'
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

export default async function PlanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  const lang = (profile?.language || locale || 'es') as 'es' | 'de' | 'en'

  const { data: scheduledItems } = await supabase
    .from('content_items')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['scheduled', 'approved'])
    .order('scheduled_date', { ascending: true })

  // Build calendar grid for current month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthNames: Record<string, string[]> = {
    es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  }
  const dayNames: Record<string, string[]> = {
    es: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
    de: ['So','Mo','Di','Mi','Do','Fr','Sa'],
    en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  }

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { es: 'Calendario', de: 'Kalender', en: 'Calendar' },
      subtitle: { es: 'Programa y visualiza tu contenido', de: 'Plane und visualisiere deine Inhalte', en: 'Schedule and visualize your content' },
      scheduledContent: { es: 'Contenido Programado', de: 'Geplante Inhalte', en: 'Scheduled Content' },
      noScheduled: { es: 'No hay contenido programado', de: 'Keine geplanten Inhalte', en: 'No scheduled content' },
      createFirst: { es: 'Crea contenido desde el generador', de: 'Erstelle Inhalte im Generator', en: 'Create content from the generator' },
    }
    return translations[key]?.[lang] || key
  }

  // Group scheduled items by date
  const itemsByDate: Record<string, any[]> = {}
  scheduledItems?.forEach((item: any) => {
    if (item.scheduled_date) {
      const dateKey = item.scheduled_date
      if (!itemsByDate[dateKey]) itemsByDate[dateKey] = []
      itemsByDate[dateKey].push(item)
    }
  })

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} className="text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Link href={`/${locale}/create`} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus size={16} />
          {lang === 'de' ? 'Neu' : lang === 'es' ? 'Nuevo' : 'New'}
        </Link>
      </div>

      {/* Calendar */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">
            {monthNames[lang][month]} {year}
          </h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-muted"><ChevronLeft size={16} /></button>
            <button className="p-2 rounded-lg hover:bg-muted"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dayNames[lang].map(day => (
            <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2">{day}</div>
          ))}
          {calendarDays.map((day, i) => {
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
            const dayItems = dateStr ? itemsByDate[dateStr] : []
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
            return (
              <div key={i} className={`min-h-[80px] border border-border/50 rounded-lg p-1.5 text-xs ${
                isToday ? 'bg-primary/5 border-primary/30' : ''
              } ${!day ? 'opacity-30' : ''}`}>
                {day && (
                  <>
                    <span className={`font-bold ${isToday ? 'text-primary' : ''}`}>{day}</span>
                    {dayItems?.map((item: any, j: number) => (
                      <div key={j} className="mt-0.5 px-1 py-0.5 bg-primary/10 text-primary rounded text-[10px] truncate">
                        {PILLARS[item.pillar as keyof typeof PILLARS]?.emoji} {item.type}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Scheduled list */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">{t('scheduledContent')}</h2>
        {scheduledItems && scheduledItems.length > 0 ? (
          <div className="space-y-3">
            {scheduledItems.map((item: any) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{PILLARS[item.pillar as keyof typeof PILLARS]?.emoji || '📝'}</span>
                    <div>
                      <p className="font-medium text-sm">{item.title || item.pillar}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.scheduled_date} {item.scheduled_time || ''} · {item.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg">
                    {item.status === 'scheduled' ? (lang === 'de' ? 'Geplant' : lang === 'es' ? 'Programado' : 'Scheduled') : (lang === 'de' ? 'Genehmigt' : lang === 'es' ? 'Aprobado' : 'Approved')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Calendar size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">{t('noScheduled')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('createFirst')}</p>
            <Link href={`/${locale}/create`} className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
              <Plus size={14} />
              {lang === 'de' ? 'Erstellen' : lang === 'es' ? 'Crear' : 'Create'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}