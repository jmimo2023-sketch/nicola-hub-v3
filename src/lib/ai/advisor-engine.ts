// ============================================================================
// NICOLA SCHAEFER HUB v3 — AI Advisor Engine
// Strategic content advisor that recommends actions based on analytics
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdvisorInsight {
  id: string
  type: 'success' | 'warning' | 'opportunity' | 'action'
  category: 'content' | 'timing' | 'pillar' | 'engagement' | 'growth' | 'hashtag' | 'frequency'
  title: string
  description: string
  metric?: number
  metricLabel?: string
  actionLabel?: string
  actionType?: string
  priority: 'high' | 'medium' | 'low'
}

export interface AdvisorReport {
  contentHealthScore: number
  insights: AdvisorInsight[]
  weeklyRecommendation: string
  optimalPostCount: { min: number; max: number; current: number }
  topPillar: string | null
  bestTimeSlot: string | null
}

// ── Analysis Functions ──────────────────────────────────────────────────────

export async function generateAdvisorReport(userId: string): Promise<AdvisorReport> {
  const supabase = await createServerSupabaseClient()
  const insights: AdvisorInsight[] = []

  // Get user's content items
  const { data: contentItems } = await supabase
    .from('content_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get analytics snapshots
  const { data: analytics } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30)

  // Get profile for brand voice
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_voice, language')
    .eq('user_id', userId)
    .single()

  const brandVoice = (profile?.brand_voice as Record<string, unknown>) || {}
  const pillars = (brandVoice?.pillars as string[]) || []
  const items = contentItems || []
  const snaps = analytics || []

  // ── Content Health Score ──────────────────────────────────────────────
  let healthScore = 50 // start at 50

  // Consistency bonus (posting regularly)
  const last7Days = items.filter(i => {
    const created = new Date(i.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return created >= weekAgo
  })
  if (last7Days.length >= 4) healthScore += 15
  else if (last7Days.length >= 2) healthScore += 8

  // Pillar diversity bonus
  const usedPillars = new Set(items.map(i => i.pillar))
  if (usedPillars.size >= 3) healthScore += 10
  else if (usedPillars.size >= 2) healthScore += 5

  // Engagement bonus (if analytics available)
  if (snaps.length > 0) {
    const avgEngagement = snaps.reduce((sum, s) => sum + (s.engagement_rate || 0), 0) / snaps.length
    if (avgEngagement > 5) healthScore += 15
    else if (avgEngagement > 3) healthScore += 10
    else if (avgEngagement > 1) healthScore += 5
  }

  // Draft backlog penalty
  const drafts = items.filter(i => i.status === 'draft').length
  if (drafts > 5) healthScore -= 5

  healthScore = Math.max(0, Math.min(100, healthScore))

  // ── Frequency Insight ──────────────────────────────────────────────────
  const postsThisWeek = last7Days.length
  const optimalMin = 3
  const optimalMax = 5

  if (postsThisWeek < optimalMin) {
    insights.push({
      id: 'freq-low',
      type: 'warning',
      category: 'frequency',
      title: 'Publicaciones insuficientes esta semana',
      description: `Solo publicaste ${postsThisWeek} veces esta semana. Tu óptimo es ${optimalMin}-${optimalMax} posts para mantener el engagement.`,
      metric: postsThisWeek,
      metricLabel: 'posts esta semana',
      actionLabel: 'Generar ideas',
      actionType: 'generate_ideas',
      priority: 'high',
    })
  } else if (postsThisWeek >= optimalMin && postsThisWeek <= optimalMax) {
    insights.push({
      id: 'freq-good',
      type: 'success',
      category: 'frequency',
      title: '¡Frecuencia ideal!',
      description: `Publicaste ${postsThisWeek} veces esta semana. Estás en el rango óptimo.`,
      metric: postsThisWeek,
      metricLabel: 'posts esta semana',
      priority: 'medium',
    })
  }

  // ── Pillar Distribution ────────────────────────────────────────────────
  if (pillars.length > 0) {
    const pillarCounts: Record<string, number> = {}
    items.forEach(i => {
      pillarCounts[i.pillar] = (pillarCounts[i.pillar] || 0) + 1
    })

    const usedPillarList = pillars.filter(p => (pillarCounts[p] || 0) > 0)
    const unusedPillars = pillars.filter(p => !(pillarCounts[p] || 0))

    if (unusedPillars.length > 0) {
      insights.push({
        id: 'pillar-unused',
        type: 'opportunity',
        category: 'pillar',
        title: 'Pilares sin contenido',
        description: `No has creado contenido para: ${unusedPillars.join(', ')}. Diversifica tu contenido para mayor alcance.`,
        actionLabel: 'Crear contenido',
        actionType: 'create_for_pillar',
        priority: 'medium',
      })
    }

    // Find top pillar
    const topPillar = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1])[0]
    if (topPillar) {
      insights.push({
        id: 'pillar-top',
        type: 'success',
        category: 'pillar',
        title: 'Tu pilar más fuerte',
        description: `"${topPillar[0]}" tiene ${topPillar[1]} piezas de contenido. Sigue enfocándote aquí.`,
        metric: topPillar[1],
        metricLabel: 'piezas',
        priority: 'low',
      })
    }
  }

  // ── Draft Backlog ──────────────────────────────────────────────────────
  if (drafts > 0) {
    insights.push({
      id: 'drafts-backlog',
      type: 'opportunity',
      category: 'content',
      title: `${drafts} borradores pendientes`,
      description: `Tienes ${drafts} piezas en borrador. Revísalas y prográmalas para mantener consistencia.`,
      metric: drafts,
      metricLabel: 'borradores',
      actionLabel: 'Ver borradores',
      actionType: 'view_drafts',
      priority: 'medium',
    })
  }

  // ── Best Time ──────────────────────────────────────────────────────────
  if (snaps.length > 0) {
    // Find the time slot with highest engagement
    const hourlyEngagement: Record<number, number[]> = {}
    snaps.forEach(s => {
      const hour = new Date(s.created_at).getHours()
      if (!hourlyEngagement[hour]) hourlyEngagement[hour] = []
      hourlyEngagement[hour].push(s.engagement_rate || 0)
    })

    let bestHour = 18 // default
    let bestAvg = 0
    Object.entries(hourlyEngagement).forEach(([hour, rates]) => {
      const avg = rates.reduce((s, r) => s + r, 0) / rates.length
      if (avg > bestAvg) {
        bestAvg = avg
        bestHour = parseInt(hour)
      }
    })

    insights.push({
      id: 'best-time',
      type: 'action',
      category: 'timing',
      title: 'Mejor hora para publicar',
      description: `Tus posts a las ${bestHour}:00 tienen en promedio ${bestAvg.toFixed(1)}% de engagement.`,
      metric: bestAvg,
      metricLabel: '% engagement',
      priority: 'high',
    })
  } else {
    insights.push({
      id: 'best-time-default',
      type: 'action',
      category: 'timing',
      title: 'Mejor hora sugerida',
      description: 'Basado en datos de la industria, 6-8 PM es el mejor horario para tu audiencia.',
      actionLabel: 'Programar para esta hora',
      actionType: 'schedule_best_time',
      priority: 'medium',
    })
  }

  // ── Scheduling Gap ────────────────────────────────────────────────────
  const scheduled = items.filter(i => i.status === 'scheduled')
  if (scheduled.length === 0) {
    insights.push({
      id: 'no-scheduled',
      type: 'warning',
      category: 'frequency',
      title: 'Sin contenido programado',
      description: 'No tienes contenido programado para los próximos días. Programa ahora para mantener consistencia.',
      actionLabel: 'Programar contenido',
      actionType: 'schedule_now',
      priority: 'high',
    })
  }

  // ── Weekly Recommendation (AI-powered) ──────────────────────────────────
  let weeklyRecommendation = 'Esta semana, enfócate en crear contenido de tus pilares más fuertes y programa al menos 3-5 posts para mantener el ritmo.'

  // Generate AI recommendation if we have data
  if (items.length > 0 && pillars.length > 0) {
    const topPillar = items.reduce((acc, item) => {
      acc[item.pillar] = (acc[item.pillar] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const strongest = (Object.entries(topPillar) as [string, number][]).sort((a, b) => b[1] - a[1])[0]
    if (strongest) {
      weeklyRecommendation = `Tu pilar "${strongest[0]}" tiene más contenido (${strongest[1]} piezas). Esta semana, mantén ese ritmo y agrega 1-2 piezas de un pilar que hayas descuidado. Programa tus mejores posts para las 6-8 PM cuando tu audiencia está más activa.`
    }
  }

  return {
    contentHealthScore: healthScore,
    insights: insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }),
    weeklyRecommendation,
    optimalPostCount: { min: optimalMin, max: optimalMax, current: postsThisWeek },
    topPillar: insights.find(i => i.id === 'pillar-top')?.description || null,
    bestTimeSlot: insights.find(i => i.id === 'best-time')?.description || null,
  }
}