-- Nicola Schaefer Hub v3 — Sprint 9-12: Media, Publishing, Insights, Workflows
-- Run this in Supabase SQL Editor

-- ============================================================================
-- MEDIA ASSETS (enhanced)
-- ============================================================================

-- Add media-specific columns to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS blur_hash TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS duration REAL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS color_dominant TEXT;

-- ============================================================================
-- CONTENT TEMPLATES (seed data)
-- ============================================================================

INSERT INTO content_templates (user_id, name, pillar, type, language, description, hook_pattern, structure, cta_pattern, hashtag_groups, tone_guidance, example, is_custom) VALUES
(NULL, 'Historia de Transformación', 'transformation', 'post', 'es', 'Plantilla para compartir tu journey de transformación personal', '¿Alguna vez sentiste que [situación negativa]? Yo también. Pero entonces...', '["Hook emocional", "Contexto del antes", "El punto de quiebre", "La decisión de cambiar", "Resultados actuales", "Invitación a compartir"]', '¿Tú también has pasado por algo similar? Cuéntame en los comentarios 👇', '[["#transformación", "#crecimiento", "#desarrollopersonal"], ["#resiliencia", "#cambio", "#vida"]]', 'Vulnerable pero esperanzador. Mostrar la humanidad del proceso sin perder la fuerza del resultado.', '¿Alguna vez sentiste que tu vida estaba estancada? Yo también.\n\nHace un año, estaba exactamente ahí. Sin dirección, sin motivación, sin creer que algo pudiera cambiar.\n\nPero entonces tomé una decisión que lo cambió todo...\n\nEl cambio no fue de la noche a la mañana. Fueron pequeños pasos. Decir que sí cuando todo decía que no. Elegir la incomodidad del crecimiento sobre la comodidad de lo conocido.\n\nHoy puedo decir que del otro lado del valle, hay una versión de ti que te está esperando.\n\n¿Tú también has pasado por algo similar? Cuéntame en los comentarios 👇', false),

(NULL, 'Carousel de Tips', 'systematic_method', 'carousel', 'es', 'Carousel de 5 slides con tips accionables', '5 cosas que desearía haber sabido antes de [tema]', '["Slide 1: Hook + promesa", "Slides 2-4: Tips con ejemplo", "Slide 5: Resumen + CTA"]', 'Guarda este post para cuando lo necesites 📌', '[["#tips", "#consejos", "#aprender"], ["#productividad", "#hábitos"]]', 'Directo y práctico. Cada tip debe ser accionable en menos de 30 segundos.', 'Slide 1: 5 cosas que desearía haber sabido antes de empezar mi negocio\n\nSlide 2: #1 No necesitas ser perfecto para empezar — necesitas empezar para ser perfecto\n\nSlide 3: #2 Tu primera versión será mala. Y eso está bien. Es el precio de la entrada.\n\nSlide 4: #3 La consistencia vence al talento. Cada. Soltera. Vez.\n\nSlide 5: ¿Cuál de estos tips resuena más contigo? 👇', false),

(NULL, 'Reel de Hook + Valor + CTA', 'emotional_mastery', 'reel', 'es', 'Estructura de 30-60 segundos: gancho, valor, llamado a la acción', '[Gancho controversial o pregunta] + [Entrega de valor rápida] + [CTA]', '["0-3s: Hook que detiene el scroll", "3-20s: Valor directo y accionable", "20-30s: CTA claro"]', 'Sígueme para más contenido como este 🔔', '[["#reels", "#viral", "#crecimiento"]]', 'Energético pero auténtico. Usar pausas dramáticas. Empezar fuerte.', 'HOOK: "Lo que nadie te dice sobre la resiliencia..."\n\nVALOR: "No se trata de nunca caer. Se trata de cuánto tardas en levantarte. Y la respuesta? Cada vez menos."\n\nCTA: "Sígueme para más verdades que necesitas escuchar 🔔"', false),

(NULL, 'Story de Cuestionario', 'community', 'story', 'es', 'Story interactiva con encuesta/pregunta para generar engagement', '¿Tú qué opinas? [pregunta polarizante]', '["Slide pregunta", "Slide contexto/opinión", "Slide resultados o reflexión"]', 'Responde en la encuesta arriba 👆', '[["#encuesta", "#opinión", "#comunidad"]]', 'Cercano y conversacional. Como si le estuvieras preguntando a un amigo.', '¿Tú qué opinas? 👆\n\nLa pregunta de hoy: ¿Es posible ser feliz Y ambicioso al mismo tiempo?\n\nYo creo que sí. Pero no la felicidad que nos venden. La felicidad de estar en paz con tu camino.\n\nResponde en la encuesta arriba 👆', false),

(NULL, 'Post de Vulnerabilidad', 'emotional_mastery', 'post', 'es', 'Post auténtico que conecta a través de la vulnerabilidad', 'Hoy quiero ser honesto/a con ustedes...', '["Momento de vulnerabilidad", "Lección aprendida", "Mensaje de esperanza"]', 'Si esto te resonó, compártelo con alguien que lo necesite 💜', '[["#vulnerabilidad", "#honestidad", "#crecimiento"]]', 'Crudo, honesto, sin filtro. Mostrar las cicatrices, no solo las medallas.', 'Hoy quiero ser honesta con ustedes.\n\nEsta semana fue difícil. No la mala difícil. La que te hace cuestionar todo.\n\nY en medio de eso, recordé algo importante: no tengo que tener todas las respuestas. Solo tengo que seguir caminando.\n\nLas cicatrices que llevamos no son señales de debilidad. Son prueba de que sobrevivimos.\n\nSi esto te resonó, compártelo con alguien que lo necesite 💜', false);

-- ============================================================================
-- WORKFLOW DEFINITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'milestone', 'event')),
  trigger_config JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- WORKFLOW EXECUTION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  current_step INTEGER DEFAULT 0,
  step_results JSONB DEFAULT '[]',
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('publish_success', 'publish_failed', 'comment', 'milestone', 'reminder', 'insight', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CONTENT PILLAR METRICS (for AI advisor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pillar_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  pillar TEXT NOT NULL,
  date DATE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL DEFAULT 0,
  avg_reach INTEGER DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  avg_saves INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pillar, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workflow_executions_user ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pillar_metrics_user_date ON pillar_metrics(user_id, date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pillar_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_all_own" ON workflows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workflow_executions_all_own" ON workflow_executions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_all_own" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "pillar_metrics_all_own" ON pillar_metrics FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();