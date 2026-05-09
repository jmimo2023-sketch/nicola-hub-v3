'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PILLARS } from '@/types'
import {
  Zap, Play, Clock, Star, ArrowRight, Sparkles, FileText,
  Image, Video, LayoutGrid, MessageCircle, ChevronRight
} from 'lucide-react'
import { FadeIn } from '@/components/ui/motion'

// ── Workflow Templates ─────────────────────────────────────────────────────────

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  steps: string[]
  trigger: string
  pillar?: string
  popular?: boolean
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'weekly-planner',
    name: 'Planificador Semanal',
    description: 'Genera 5 ideas de contenido → Crea borradores → Programa en mejores horarios',
    icon: <Clock size={20} className="text-blue-500" />,
    steps: ['Generar ideas con IA', 'Crear borradores', 'Asignar pilares', 'Programar en mejores horarios'],
    trigger: 'manual',
    popular: true,
  },
  {
    id: 'content-pipeline',
    name: 'Pipeline de Contenido',
    description: 'Idea → Borrador → Revisión → Aprobado → Programado → Publicado',
    icon: <ArrowRight size={20} className="text-green-500" />,
    steps: ['Crear idea', 'Desarrollar borrador', 'Revisar calidad', 'Aprobar', 'Programar', 'Publicar'],
    trigger: 'manual',
    popular: true,
  },
  {
    id: 'engagement-booster',
    name: 'Engagement Booster',
    description: 'Publicar → Responder comentarios en 1h → Analizar a las 24h',
    icon: <MessageCircle size={20} className="text-pink-500" />,
    steps: ['Publicar contenido', 'Esperar 1h', 'Responder comentarios', 'Esperar 24h', 'Analizar resultados'],
    trigger: 'event:publish',
  },
  {
    id: 'evergreen-recycler',
    name: 'Reciclador Evergreen',
    description: 'Tomar top posts → Adaptar con IA → Re-programar',
    icon: <Star size={20} className="text-yellow-500" />,
    steps: ['Identificar top posts', 'Analizar qué funcionó', 'Adaptar con IA', 'Re-programar'],
    trigger: 'scheduled:weekly',
  },
  {
    id: 'campaign-launcher',
    name: 'Lanzador de Campaña',
    description: 'Crea campaña → Genera N piezas → Agenda por semanas',
    icon: <Zap size={20} className="text-purple-500" />,
    steps: ['Definir objetivo', 'Generar piezas IA', 'Crear variaciones', 'Programar semanales'],
    trigger: 'manual',
  },
]

const CONTENT_TEMPLATES = [
  {
    id: 'transformation-story',
    name: 'Historia de Transformación',
    pillar: 'transformation' as const,
    type: 'post',
    description: 'Comparte tu journey de transformación personal',
    emoji: '🦋',
    structure: ['Hook emocional', 'Contexto del antes', 'Punto de quiebre', 'Decisión de cambiar', 'Resultados', 'CTA'],
  },
  {
    id: 'tips-carousel',
    name: 'Carousel de Tips',
    pillar: 'systematic_method' as const,
    type: 'carousel',
    description: '5 tips accionables en carousel',
    emoji: '🔧',
    structure: ['Slide 1: Hook + promesa', 'Slides 2-4: Tips', 'Slide 5: Resumen + CTA'],
  },
  {
    id: 'vulnerability-post',
    name: 'Post de Vulnerabilidad',
    pillar: 'emotional_mastery' as const,
    type: 'post',
    description: 'Post auténtico que conecta a través de la vulnerabilidad',
    emoji: '💜',
    structure: ['Momento de vulnerabilidad', 'Lección aprendida', 'Mensaje de esperanza'],
  },
  {
    id: 'reel-hook-cta',
    name: 'Reel Hook + Valor + CTA',
    pillar: 'emotional_mastery' as const,
    type: 'reel',
    description: 'Estructura de 30-60 segundos',
    emoji: '🎬',
    structure: ['0-3s: Hook', '3-20s: Valor', '20-30s: CTA'],
  },
  {
    id: 'community-question',
    name: 'Story de Cuestionario',
    pillar: 'community' as const,
    type: 'story',
    description: 'Story interactiva con pregunta para engagement',
    emoji: '🤝',
    structure: ['Pregunta polarizante', 'Tu opinión', 'Resultados/reflexión'],
  },
  {
    id: 'valley-lesson',
    name: 'Lección del Valle',
    pillar: 'valley_experience' as const,
    type: 'post',
    description: 'Comparte lo que aprendiste en tiempos difíciles',
    emoji: '🏔️',
    structure: ['Contexto del valle', 'La lección', 'Cómo te fortaleció', 'Invitación a compartir'],
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export function WorkflowBuilder() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'templates'>('workflows')
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Zap size={28} className="text-primary" />
          Flujos de Trabajo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Automatiza tu proceso de creación de contenido
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('workflows')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-all',
            activeTab === 'workflows' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Zap size={14} className="inline mr-1.5" /> Flujos
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-all',
            activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText size={14} className="inline mr-1.5" /> Plantillas de Contenido
        </button>
      </div>

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecciona un flujo predefinido o crea el tuyo propio. Los flujos automatizan tu proceso de creación de contenido.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {WORKFLOW_TEMPLATES.map((workflow) => (
              <FadeIn key={workflow.id}>
                <Card className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedWorkflow === workflow.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                )}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        {workflow.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{workflow.name}</h3>
                          {workflow.popular && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-0">Popular</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>

                        {/* Steps */}
                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                          {workflow.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {step}
                              </span>
                              {i < workflow.steps.length - 1 && (
                                <ChevronRight size={10} className="text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-[10px]">
                            <Clock size={10} className="mr-1" />
                            {workflow.trigger === 'manual' ? 'Manual' : workflow.trigger}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {workflow.steps.length} pasos
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>

          {selectedWorkflow && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">
                    {WORKFLOW_TEMPLATES.find(w => w.id === selectedWorkflow)?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Se ejecutará cuando lo actives manualmente
                  </p>
                </div>
                <Button className="gap-1.5">
                  <Play size={14} /> Activar Flujo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Plantillas probadas para cada tipo de contenido. Selecciona una y la IA generará contenido personalizado.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTENT_TEMPLATES.map((template) => {
              const pillar = template.pillar ? PILLARS[template.pillar] : null
              return (
                <FadeIn key={template.id}>
                  <Card className="cursor-pointer transition-all hover:shadow-md group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{template.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-sm">{template.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{template.type}</Badge>
                            {pillar && (
                              <Badge style={{ backgroundColor: pillar.color + '20', color: pillar.color, borderColor: pillar.color + '40' }} className="text-[10px] border">
                                {pillar.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">{template.description}</p>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">Estructura:</p>
                        {template.structure.map((step, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </div>
                            <span className="text-muted-foreground">{step}</span>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" size="sm" className="w-full mt-3 gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Sparkles size={12} /> Usar plantilla
                      </Button>
                    </CardContent>
                  </Card>
                </FadeIn>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}