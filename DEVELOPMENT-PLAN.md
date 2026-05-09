# 🚀 Nicola Schaefer Hub v3 — Development Plan Completo

## Investigación y Referencias

### Aplicaciones Analizadas
| App | Fortaleza | Qué Tomamos |
|-----|-----------|-------------|
| **Hootsuite** | Calendar visual, scheduling multi-plataforma, inbox unificado, analytics, approval workflows | Calendario drag & drop, cola de publicación, flujos de aprobación |
| **Metricool** | AI assistant integrado, calendar visual, auto-lists, adaptación por plataforma, créditos AI | AI shortcuts (emoji, CTA, hashtags, tone, translate), preview por plataforma |
| **Postiz** | Open-source, agentic scheduling, auto-actions, multi-plat (18+), team collaboration | Auto-actions (milestone triggers), API pública, CLI/MCP integration |
| **BrightBean Studio** | Kanban idea board, version history, client portal, approval stages | Kanban de ideas, versionado de contenido, etapas de aprobación |
| **Buffer** | AI assistant simple, cola de publicación, analytics limpios | Cola visual, AI rewrite shortcuts, best time suggestions |
| **Plann** | Integración Canva, strategy first, content pillars | Strategy board, pillar-based planning |

### Capacidades Actuales (Lo que YA funciona)
- ✅ Auth (email/password + magic link)
- ✅ Onboarding wizard (3 pasos: idioma, pilares, tono)
- ✅ i18n (ES/DE/EN) con next-intl v4
- ✅ Supabase (8 tablas + RLS)
- ✅ Dashboard layout (sidebar, header, mobile nav)
- ✅ Páginas creadas: Home, Create, Plan, Insights, Assets, Campaigns, Settings, Inbox, Listening
- ✅ Instagram OAuth + callback
- ✅ Hashtag Generator (AI via OpenRouter)
- ✅ Best Time to Post
- ✅ Smart Replies (AI)
- ✅ Social Listening (mentions, alerts, trends)
- ✅ Analytics Pro (Recharts)
- ✅ Content Studio (Ideas, Weekly Calendar, Adapt)
- ✅ Trend Caption Generator

### Brechas Críticas (Lo que FALTA para ser competitivo)
1. **Calendario real con drag & drop** — El Plan page es placeholder
2. **Motor de programación** — No hay scheduling engine ni cola de publicación
3. **Flujo de creación → revisión → aprobación → publicación** — Falta pipeline completo
4. **Media Studio** — No hay upload, gestión, ni preview de assets
5. **Publicación directa a Instagram** — OAuth funciona pero publish no está conectado
6. **Plantillas de contenido** — No hay template editor ni sistema de plantillas
7. **AI como asesor de decisiones** — La IA genera texto pero no recomienda estrategia
8. **Auto-actions** — No hay triggers automáticos (milestone, time-based)

---

## Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────┐
│                    NICOLA SCHAEFER HUB v3                │
├─────────────┬─────────────┬──────────────┬───────────────┤
│  🎨 CREATE  │  📅 PLAN    │  📊 INSIGHTS │  ⚡ AUTOMATE  │
├─────────────┼─────────────┼──────────────┼───────────────┤
│ AI Studio   │ Calendar    │ Analytics    │ Auto-actions  │
│ Templates   │ Queue       │ Top Posts    │ Milestones    │
│ Media Lib   │ Drag & Drop │ Competitors  │ Triggers      │
│ Adapt       │ Best Times  │ Sentiment    │ Smart Rules   │
├─────────────┴─────────────┴──────────────┴───────────────┤
│                     🔄 WORKFLOW ENGINE                     │
│  Draft → Review → Approved → Scheduled → Published        │
├──────────────────────────────────────────────────────────┤
│                    📱 INBOX UNIFICADO                      │
│  Comments · DMs · Mentions · Smart Replies                │
└──────────────────────────────────────────────────────────┘
```

---

## Sprints de Desarrollo

### Sprint 8A: Content Calendar & Scheduling Engine ⏰
**Objetivo**: El usuario puede planificar contenido en un calendario visual y programar publicaciones

#### Archivos Nuevos
- `src/components/calendar/content-calendar.tsx` — Calendario mensual/semanal con drag & drop
- `src/components/calendar/calendar-day.tsx` — Día del calendario con posts
- `src/components/calendar/schedule-modal.tsx` — Modal para agendar publicación
- `src/components/calendar/publish-queue.tsx` — Cola de publicaciones pendientes
- `src/lib/scheduling/engine.ts` — Motor de programación (calcula mejores horarios, gestiona cola)
- `src/lib/scheduling/publisher.ts` — Ejecutor de publicaciones (llama Meta API)
- `src/app/api/scheduling/create/route.ts` — Crear publicación programada
- `src/app/api/scheduling/update/route.ts` — Actualizar publicación
- `src/app/api/scheduling/publish/route.ts` — Publicar ahora
- `src/app/api/scheduling/queue/route.ts` — Obtener cola de publicaciones
- `supabase/migrations/004_scheduling_and_queue.sql` — Tabla scheduled_posts + publishing_queue

#### Funcionalidades
1. **Vista mensual/semana/día** del calendario con contenido existente
2. **Drag & drop** para mover posts entre días
3. **Schedule modal** — fecha, hora, timezone, preview del post
4. **Cola de publicación** — lista ordenada de lo que se publica pronto
5. **Best time suggestions** integrado — al agendar, sugerir mejores horarios
6. **Auto-recurring** — repetir posts en intervalos (semanal, quincenal)
7. **Publishing queue status** — pending, publishing, published, failed

#### API Flow
```
POST /api/scheduling/create  → crea ContentItem con status='scheduled'
PATCH /api/scheduling/update → mueve fecha/hora de publicación
POST /api/scheduling/publish → publica inmediatamente via Meta API
GET /api/scheduling/queue    → lista posts programados ordenados por fecha
```

---

### Sprint 8B: AI Content Studio Enhancement 🤖
**Objetivo**: La IA no solo genera texto — es un asesor estratégico que recomienda, adapta y decide

#### Archivos Nuevos/Modificados
- `src/components/ai/content-studio.tsx` — Reescritura completa con tabs: Ideas, Write, Adapt, Strategy
- `src/components/ai/ai-advisor-chat.tsx` — Chat con el asesor de contenido (conversacional)
- `src/components/ai/strategy-board.tsx` — Tablero estratégico con recomendaciones
- `src/lib/ai/advisor-engine.ts` — Motor de asesoramiento (analiza métricas, recomienda acciones)
- `src/lib/ai/content-engine.ts` — Enhanced con shortcuts (emoji, CTA, hashtags, tone, translate, length)
- `src/app/api/ai/advisor/route.ts` — Endpoint de asesoramiento
- `src/app/api/ai/shortcuts/route.ts` — AI shortcuts (transformaciones rápidas)

#### AI Shortcuts (inspirado en Metricool)
| Shortcut | Descripción |
|----------|-------------|
| ✨ Emojify | Agrega emojis relevantes al caption |
| 🏷️ Hashtags | Genera hashtags estratégicos basados en el pilar |
| 📢 CTA | Agrega call-to-action adaptado al tipo de contenido |
| 🎭 Tone | Cambia el tono (vulnerable → empowering, etc.) |
| 🌐 Translate | Traduce el caption a DE/EN/ES |
| ✂️ Shorten | Acorta manteniendo el mensaje |
| 📏 Lengthen | Expande con más detalle |
| 🔄 Repurpose | Adaptar el mismo contenido para Reel/Story/Carousel |

#### AI Advisor (inspirado en Hootsuite + Metricool)
- **Strategy recommendations**: "Tus posts de Transformation tienen 2.3x más engagement — enfócate ahí"
- **Content calendar suggestions**: "No tienes nada programado para martes — ¿generamos ideas?"
- **Performance insights**: "Tus Reels del último mes tuvieron 40% más alcance que tus posts estáticos"
- **Hashtag analysis**: "Estos 5 hashtags no están generando alcance — prueba estos alternativos"
- **Posting frequency alert**: "Esta semana solo publicaste 2 veces — tu óptimo es 4-5"

---

### Sprint 9: Media Studio & Asset Management 🖼️
**Objetivo**: Upload, organizar, y usar medios visuales de forma eficiente

#### Archivos Nuevos
- `src/components/media/media-studio.tsx` — Galería + upload + editor
- `src/components/media/asset-grid.tsx` — Grid de assets con filtros
- `src/components/media/upload-zone.tsx` — Drag & drop upload con preview
- `src/components/media/asset-detail.tsx` — Detalle del asset con metadata
- `src/lib/media/upload.ts` — Upload a Supabase Storage con resize
- `src/lib/media/optimizer.ts` — Auto-generate thumbnails y variantes por plataforma
- `src/app/api/media/upload/route.ts` — Endpoint de upload
- `src/app/api/media/[id]/route.ts` — CRUD de assets

#### Funcionalidades
1. **Upload drag & drop** — imágenes y videos con preview
2. **Organización por carpetas** (folder = pillar por defecto)
3. **Tags y búsqueda** — encontrar assets rápido
4. **Auto-thumbnails** — generar variantes para feed, story, reel
5. **Metadata automática** — dimensiones, tamaño, tipo MIME
6. **Uso tracking** — qué assets se usan en qué posts
7. **Integración con Create** — seleccionar assets al crear contenido

---

### Sprint 10: Instagram Publishing & Publishing Queue 📱
**Objetivo**: Publicar contenido directamente a Instagram desde la plataforma

#### Archivos Nuevos/Modificados
- `src/lib/instagram/publish.ts` — Enhanced publish engine (carousel, reels, stories)
- `src/lib/instagram/token-refresh.ts` — Auto-refresh de tokens
- `src/lib/scheduling/publisher.ts` — Cron-based publisher (verifica cada 5 min)
- `src/app/api/instagram/publish/route.ts` — Publicar contenido
- `src/app/api/instagram/publish-status/route.ts` — Status de publicación
- `src/app/api/cron/publish/route.ts` — Vercel Cron endpoint para publicar
- `supabase/migrations/005_publishing_queue.sql` — Tabla publishing_queue + triggers

#### Flujo de Publicación
```
ContentItem (status=scheduled)
    → scheduled_date + scheduled_time llega
    → Publishing Engine lo detecta
    → Llama Meta Content Publishing API
    → Carousel: upload N containers → publish carousel
    → Reel: upload video container → publish reel
    → Story: upload image/video → publish story
    → Status: published ✅ or failed ❌ (con retry)
```

#### Vercel Cron
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/publish",
    "schedule": "*/5 * * * *"
  }]
}
```

---

### Sprint 11: Smart Insights & Decision Support 📊
**Objetivo**: La plataforma no solo muestra datos — recomienda acciones

#### Archivos Nuevos/Modificados
- `src/components/insights/smart-insights.tsx` — Dashboard con recomendaciones AI
- `src/components/insights/performance-score.tsx` — Score general de rendimiento
- `src/components/insights/content-health.tsx` — Salud del contenido por pilar
- `src/components/insights/growth-tracker.tsx` — Tracking de crecimiento con predicciones
- `src/lib/ai/advisor-engine.ts` — Enhanced con análisis predictivo
- `src/app/api/insights/recommendations/route.ts` — AI recommendations
- `src/app/api/insights/health/route.ts` — Content health check

#### Decision Support Features
1. **Content Health Score** — Puntuación 0-100 basada en consistencia, engagement, crecimiento
2. **Pillar Performance** — Qué pilar genera más engagement → recomendación de enfoque
3. **Optimal Posting Frequency** — "Deberías publicar X veces/semana"
4. **Engagement Prediction** — Predicción de engagement antes de publicar
5. **Competitor Gap Analysis** — Qué contenido funciona en tu nicho que tú no haces
6. **Weekly Digest** — Email automático con resumen semanal (futuro)

---

### Sprint 12: Workflow Automation & Templates ⚡
**Objetivo**: Automatizar el flujo de trabajo del creador

#### Archivos Nuevos
- `src/components/workflow/workflow-builder.tsx` — Constructor visual de flujos
- `src/components/workflow/template-gallery.tsx` — Galería de plantillas
- `src/components/workflow/approval-flow.tsx` — Flujos de aprobación
- `src/components/workflow/auto-rules.tsx` — Reglas automáticas
- `src/lib/workflow/engine.ts` — Motor de workflows
- `src/lib/workflow/templates.ts` — Templates predefinidos
- `src/app/api/workflow/execute/route.ts` — Ejecutar workflow
- `supabase/migrations/006_workflows_and_templates.sql`

#### Workflows Predefinidos
1. **Content Pipeline**: Idea → Draft → Review → Scheduled → Published
2. **Weekly Planner**: Genera 5 ideas → crea drafts → agenda para best times
3. **Engagement Booster**: Publica → responde comentarios en 1h → analiza a las 24h
4. **Evergreen Recycler**: Toma top posts → adapta → re-agenda
5. **Campaign Launcher**: Crea campaña → genera N piezas → agenda por semanas

#### Content Templates
- **Story Templates**: Before/After, Poll, Quiz, Quote, Behind-the-Scenes
- **Carousel Templates**: Tips (5 slides), Tutorial, Myth vs Truth, Comparison
- **Reel Templates**: Hook → Value → CTA (30s, 60s)
- **Post Templates**: Question, Reflection, Vulnerability, Milestone

---

## Prioridad y Timeline

| Sprint | Duración | Prioridad | Impacto |
|--------|----------|-----------|---------|
| 8A: Calendar & Scheduling | 2-3 días | 🔴 Crítico | Sin esto, no hay workflow |
| 8B: AI Studio Enhancement | 2 días | 🔴 Crítico | Core diferenciador |
| 9: Media Studio | 2 días | 🟡 Alto | Necesario para publicación |
| 10: Instagram Publishing | 1-2 días | 🔴 Crítico | Sin esto, no se publica |
| 11: Smart Insights | 1-2 días | 🟡 Alto | Diferenciador vs competencia |
| 12: Workflow Automation | 2-3 días | 🟢 Medio | Valor añadido |

**Total estimado: 10-14 días de desarrollo**

---

## Principios de Diseño

1. **AI como asesor, no solo generador** — La IA recomienda, el usuario decide
2. **Pipeline visual** — Ver el flujo de cada pieza de contenido (Idea → Published)
3. **Shortcuts sobre prompts** — Un click para emojis/CTA/hashtag > escribir prompts
4. **Mobile-first** — La mayoría de creadores están en móvil
5. **Pilar-first** — Todo se organiza alrededor de los pilares de contenido
6. **Data-driven decisions** — Cada recomendación respaldada por métricas

---

## Meta API Endpoints Usados

| Función | Endpoint | Método |
|---------|----------|--------|
| Publicar imagen | `/{ig-user-id}/media` | POST |
| Publicar carousel | `/{ig-user-id}/media` + `/{ig-user-id}/carousel` | POST |
| Publicar reel | `/{ig-user-id}/media` | POST |
| Container status | `/{container-id}` | GET |
| Insights | `/{ig-user-id}/insights` | GET |
| Comments | `/{ig-media-id}/comments` | GET |
| Reply comment | `/{ig-media-id}/comments` | POST |
| Mentions | `/{ig-user-id}/tags` | GET |

---

*Documento creado: 2026-05-08*
*Última actualización: 2026-05-08*