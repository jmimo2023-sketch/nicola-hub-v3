# 🗺️ ROADMAP — Nicola Hub v3

> Última actualización: 16 Mayo 2026
> Estado: Retomando proyecto — Sprint 14 en progreso

## Sprints Completados (1-13)

| Sprint | Feature | Status |
|--------|---------|--------|
| 1 | Auth, i18n, Supabase, Vercel deploy | ✅ |
| 2 | Dashboard pages, sidebar, header, mobile nav | ✅ |
| 3 | Instagram OAuth, Hashtag Generator, Best Time, Publishing API | ✅ |
| 4 | Unified Inbox, Smart Replies, Saved templates, Comments | ✅ |
| 5 | Analytics Pro, Top Posts, Competitor Analysis | ✅ |
| 6 | AI Content Studio (Ideas, Weekly Calendar, Adapt) | ✅ |
| 7 | Social Listening, Sentiment, Crisis Alerts, Trends | ✅ |
| 8A | Content Calendar & Scheduling Engine | ✅ |
| 8B | AI Shortcuts (10 transforms) + AI Advisor Engine | ✅ |
| 9 | Media Studio & Asset Management | ✅ |
| 10 | Instagram Publishing Engine (Meta API v21.0) | ✅ |
| 11 | Smart Insights Dashboard (Recharts) | ✅ |
| 12 | Workflow Builder & Templates | ✅ |
| 13 | Video Studio (AI highlights, subtitles, captions, export) | ✅ |

---

## 🏁 Sprint 14: Meta App Setup + Instagram Login + Real Data (BLOCKER)

**Objetivo**: Conectar Instagram real → desbloquear data en dashboards
**Skill**: `nicola-hub-meta-setup`
**Prioridad**: 🔴 CRÍTICA — Todo lo demás depende de esto
**Decisión**: Usar **Instagram API with Instagram Login** (no Facebook Login) — auth directo, UX más simple, sin Facebook Page requerido

### 14A: Configurar Meta App (manual + Ichigo asiste)
- [ ] Ir a developers.facebook.com → app "Nicola Hub"
- [ ] Agregar producto **Instagram** (Instagram API with Instagram Login)
- [ ] Configurar **Business Login for Instagram**
- [ ] Agregar Redirect URI: `https://nicola-hub-v3.vercel.app/api/instagram/callback`
- [ ] Agregar App Domains: `nicola-hub-v3.vercel.app`
- [ ] Configurar permisos: `instagram_business_basic, instagram_business_content_publish, instagram_business_manage_comments, instagram_business_manage_insights`
- [ ] Agregar Instagram Testers (en development mode)

### 14B: Configurar Vercel Environment Variables
- [ ] Obtener META_APP_ID y META_APP_SECRET
- [ ] Agregar en Vercel dashboard o CLI
- [ ] Redeploy

### 14C: Reescribir OAuth Flow (Instagram Login)
- [ ] Reescribir `src/lib/instagram/auth.ts` — Instagram directo, no Facebook
- [ ] Actualizar `src/app/api/instagram/auth-url/route.ts` — nueva auth URL
- [ ] Actualizar `src/app/api/instagram/callback/route.ts` — nuevo token exchange
- [ ] Simplificar `src/components/instagram/instagram-connect.tsx` — no necesita FB Page
- [ ] Actualizar tabla `meta_connections` en Supabase
- [ ] Agregar token refresh automático (antes de 60 días)

### 14D: Verificar OAuth Flow End-to-End
- [ ] Test: Click "Conectar con Instagram" en Settings
- [ ] Verificar redirect → Instagram Login → callback → datos en Supabase
- [ ] Verificar token refresh funciona
- [ ] Test: API calls con token real (media, insights)

### 14E: Reemplazar Mock Data con Live Data
- [ ] `home-dashboard.tsx` → cargar stats reales de IG
- [ ] `analytics-dashboard.tsx` → insights reales
- [ ] `inbox-page.tsx` → comentarios reales
- [ ] `best-time-to-post.tsx` → datos reales de engagement
- [ ] Crear `src/lib/instagram/live-data.ts` con queries reales

**Entregable**: Dashboards muestran data real de Instagram, OAuth vía Instagram Login

---

## 🎨 Sprint 15: UX Polish

**Objetivo**: Experiencia de usuario profesional y fluida
**Skill**: `nicola-hub-ux-polish`
**Prioridad**: 🟡 ALTA — Percepción de calidad

### 15A: Skeleton Screens + Loading States
- [ ] Crear `src/components/ui/skeleton.tsx` (Skeleton, CardSkeleton, ListSkeleton, ChartSkeleton)
- [ ] Crear `loading.tsx` para cada dashboard page (7 páginas)
- [ ] Agregar skeletons en componentes con data fetching

### 15B: Toast Notifications
- [ ] Agregar `<Toaster>` de sonner en root layout
- [ ] Reemplazar estados de error con `toast.error()`
- [ ] Agregar toast.success en: IG connect, post schedule, profile save, template save
- [ ] Agregar toast.promise en acciones async (publish, schedule)

### 15C: Mobile Responsiveness
- [ ] Audit responsive en todas las páginas (Chrome DevTools)
- [ ] Fix home dashboard grid (1 col mobile)
- [ ] Fix insights charts con scroll horizontal
- [ ] Calendar: agregar vista de lista para mobile
- [ ] Create page: 2 cols → 1 col en mobile
- [ ] Inbox: drawer para detalle en mobile

### 15D: Optimistic Updates en Calendar
- [ ] Implementar `useOptimistic` en schedule/create
- [ ] Indicador visual para items optimistic (border-dashed + opacity)
- [ ] Rollback automático en error

### 15E: Error Boundaries
- [ ] Crear `src/app/error.tsx` global
- [ ] Crear `error.tsx` en secciones críticas (insights, inbox, calendar)
- [ ] UX amigable con botón "Intentar de nuevo"

**Entregable**: App se siente profesional, rápida y sin errores visibles

---

## 📅 Sprint 16: Google Calendar OAuth + Integraciones

**Objetivo**: Conectar Google Calendar para sincronizar contenido programado
**Skill**: `nicola-hub-dev` + Google OAuth docs
**Prioridad**: 🟡 MEDIA

### 16A: Google OAuth Setup
- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Google Calendar API
- [ ] Crear OAuth 2.0 credentials
- [ ] Configurar redirect URI
- [ ] Agregar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en Vercel

### 16B: Google Calendar Integration
- [ ] Crear `src/lib/google/auth.ts` (OAuth flow)
- [ ] Crear `src/lib/google/calendar.ts` (CRUD events)
- [ ] Crear `src/app/api/google/callback/route.ts`
- [ ] Crear tabla `google_connections` en Supabase
- [ ] Componente "Conectar Google Calendar" en Settings

### 16C: Sync Calendar → Google Calendar
- [ ] Al crear post programado → crear evento en Google Calendar
- [ ] Al editar/eliminar post → actualizar/eliminar evento
- [ ] Opción de 2-way sync (leer eventos de Google Calendar)
- [ ] UI toggle en Settings: "Sync with Google Calendar"

**Entregable**: Posts programados aparecen en Google Calendar del usuario

---

## ⚡ Sprint 17: Performance & SEO

**Objetivo**: Optimizar velocidad, bundle y discoverability
**Skill**: `nicola-hub-perf`
**Prioridad**: 🟢 BAJA (pero importante para launch)

### 17A: Lazy Load + Bundle Optimization
- [ ] Crear `src/components/analytics/lazy-chart.tsx`
- [ ] Dynamic import de Recharts en todos los componentes
- [ ] Configurar `@next/bundle-analyzer`
- [ ] Verificar reducción del initial JS bundle
- [ ] Lazy load componentes pesados (video-studio, workflow-builder)

### 17B: Image Optimization + SEO
- [ ] Configurar `images.remotePatterns` en next.config
- [ ] Migrar `<img>` a `next/image`
- [ ] Agregar metadata por página (title, description, OG)
- [ ] Crear `sitemap.ts` y `robots.ts`
- [ ] Configurar Google Font con `next/font`
- [ ] Agregar favicon y app icons

### 17C: Core Web Vitals
- [ ] Medir LCP, CLS, INP actuales con Lighthouse
- [ ] Implementar mejoras basadas en datos
- [ ] Skeletons para reducir CLS
- [ ] Priorizar LCP (hero content, font preload)
- [ ] Verificar mobile performance

**Entregable**: Lighthouse score > 90, bundle reducido ~150KB

---

## 📊 Resumen de Prioridades

| Sprint | Bloquea a | Prioridad | Tiempo Est. |
|--------|-----------|-----------|-------------|
| **14** | Todo lo demás | 🔴 Crítica | 2-3 días |
| **15** | UX profesional | 🟡 Alta | 3-4 días |
| **16** | Integraciones | 🟡 Media | 2-3 días |
| **17** | Launch ready | 🟢 Baja | 2-3 días |

## 🥷🏾 Skills Creados

| Skill | Uso |
|-------|-----|
| `nicola-hub-dev` | Contexto completo del stack, estructura, convenciones, comandos |
| `nicola-hub-meta-setup` | Guía paso a paso Meta App + OAuth |
| `nicola-hub-ux-polish` | Skeletons, toasts, mobile, optimistic updates, error boundaries |
| `nicola-hub-perf` | Lazy load, next/image, SEO, bundle, Core Web Vitals |

## 🚀 Próximo Paso Inmediato

**Sprint 14A**: Configurar Meta App en developers.facebook.com
- Jonathan necesita ir a la Meta App y configurar Facebook Login + Instagram Graph API
- Ichigo puede asistir paso a paso y luego hacer el código (14D) autónomamente
- Variables de entorno (14B) requiere que Jonathan proporcione App ID/Secret