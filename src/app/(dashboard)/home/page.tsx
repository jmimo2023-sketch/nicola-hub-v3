'use client'

import {
  Eye, Heart, UserPlus, TrendingUp, PenTool, Calendar,
  BarChart3, Sparkles, Clock, Plus
} from 'lucide-react'
import Link from 'next/link'

const kpiCards = [
  { key: 'views', label: { en: 'Total Views', es: 'Vistas Totales', de: 'Gesamtansichten' }, value: '12.6K', change: '+8%', icon: Eye, color: 'text-blue-500' },
  { key: 'engagement', label: { en: 'Engagement', es: 'Engagement', de: 'Engagement' }, value: '6.3%', change: '+1.2%', icon: Heart, color: 'text-rose-500' },
  { key: 'followers', label: { en: 'New Followers', es: 'Nuevos Seguidores', de: 'Neue Follower' }, value: '111', change: '+23', icon: UserPlus, color: 'text-green-500' },
  { key: 'reach', label: { en: 'Avg Reach', es: 'Alcance Prom.', de: 'Durchschn. Reichweite' }, value: '1.0K', change: '+5%', icon: TrendingUp, color: 'text-amber-500' },
]

const quickActions = [
  { key: 'create', label: { en: 'Create Content', es: 'Crear Contenido', de: 'Inhalt erstellen' }, icon: PenTool, href: '/create', color: 'bg-primary' },
  { key: 'schedule', label: { en: 'Schedule Post', es: 'Programar Post', de: 'Beitrag planen' }, icon: Calendar, href: '/plan', color: 'bg-blue-500' },
  { key: 'analytics', label: { en: 'View Analytics', es: 'Ver Analíticas', de: 'Analysen ansehen' }, icon: BarChart3, href: '/insights', color: 'bg-purple-500' },
]

export default function HomePage() {
  // TODO: Get language from store/UI context
  const language = 'es' as 'es' | 'de' | 'en'

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl lg:text-4xl font-bold">
          {language === 'de' ? 'Guten Tag' : language === 'es' ? 'Buenos días' : 'Good morning'}, Nicola 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'de' ? 'Hier ist deine Übersicht für diese Woche.' : language === 'es' ? 'Aquí está tu resumen de la semana.' : "Here's your overview for this week."}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={kpi.key} className="bg-card border border-border rounded-2xl p-4 lg:p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon size={18} className={kpi.color} />
              <span className="text-xs font-mono text-green-600 font-bold">{kpi.change}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label[language]}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">
          {language === 'de' ? 'Schnellstart' : language === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="group bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 transition-all"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon size={20} className="text-white" />
              </div>
              <p className="font-bold text-sm">{action.label[language]}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">AI Insight</p>
            <p className="text-sm font-medium leading-relaxed">
              {language === 'de'
                ? 'Deine beste Postzeit ist 20:00 Uhr. Beiträge über das Tal erleben 40% mehr Engagement. Versuche diese Woche einen Reel über Transformation zu erstellen.'
                : language === 'es'
                ? 'Tu mejor horario para publicar es 8:00 PM. Los posts sobre la experiencia del valle tienen 40% más engagement. Intenta crear un Reel sobre transformación esta semana.'
                : 'Your best posting time is 8 PM. Valley experience posts get 40% more engagement. Try creating a Reel about transformation this week.'}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Posts Placeholder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">
            {language === 'de' ? 'Kommende Beiträge' : language === 'es' ? 'Próximas Publicaciones' : 'Upcoming Posts'}
          </h2>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Clock size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-bold text-muted-foreground">
            {language === 'de' ? 'Keine geplanten Beiträge' : language === 'es' ? 'No hay publicaciones programadas' : 'No scheduled posts'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {language === 'de' ? 'Erstelle deinen ersten Beitrag im Generator' : language === 'es' ? 'Crea tu primera publicación en el generador' : 'Create your first post in the generator'}
          </p>
          <Link
            href="/create"
            className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} />
            {language === 'de' ? 'Erstellen' : language === 'es' ? 'Crear' : 'Create'}
          </Link>
        </div>
      </div>
    </div>
  )
}