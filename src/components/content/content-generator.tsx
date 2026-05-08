'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, Save, Copy, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { PILLARS, type ContentPillar, type ContentType, type ToneVariant } from '@/types'
import { aiGenerateContent, saveGeneratedContent } from '@/app/[locale]/(dashboard)/create/actions'

const TONES: { value: ToneVariant; label: Record<string, string>; emoji: string }[] = [
  { value: 'vulnerable', label: { es: 'Vulnerable', de: 'Verletzlich', en: 'Vulnerable' }, emoji: '💜' },
  { value: 'empowering', label: { es: 'Empoderador', de: 'Stärkend', en: 'Empowering' }, emoji: '💪' },
  { value: 'reflective', label: { es: 'Reflexivo', de: 'Nachdenklich', en: 'Reflective' }, emoji: '🪞' },
  { value: 'provocative', label: { es: 'Provocador', de: 'Provokant', en: 'Provocative' }, emoji: '🔥' },
  { value: 'warm', label: { es: 'Cálido', de: 'Warm', en: 'Warm' }, emoji: '☀️' },
  { value: 'direct', label: { es: 'Directo', de: 'Direkt', en: 'Direct' }, emoji: '⚡' },
]

const CONTENT_TYPES: { value: ContentType; label: Record<string, string> }[] = [
  { value: 'post', label: { es: 'Post', de: 'Beitrag', en: 'Post' } },
  { value: 'reel', label: { es: 'Reel', de: 'Reel', en: 'Reel' } },
  { value: 'story', label: { es: 'Story', de: 'Story', en: 'Story' } },
  { value: 'carousel', label: { es: 'Carrusel', de: 'Karussell', en: 'Carousel' } },
  { value: 'video', label: { es: 'Video', de: 'Video', en: 'Video' } },
]

interface ContentGeneratorProps {
  userId: string
  language: string
  brandVoice: string
}

export function ContentGenerator({ userId, language, brandVoice }: ContentGeneratorProps) {
  const t = useTranslations('content')
  const lang = (language || 'es') as 'es' | 'de' | 'en'

  // Form state
  const [pillar, setPillar] = useState<ContentPillar>('emotional_mastery')
  const [contentType, setContentType] = useState<ContentType>('post')
  const [tone, setTone] = useState<ToneVariant>('warm')
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{
    caption: string
    hashtags: string[]
    hook: string
    cta: string
    alternativeCaptions: string[]
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setResult(null)
    setSaved(false)

    try {
      const pillarConfig = PILLARS[pillar]
      const generated = await aiGenerateContent({
        pillar,
        pillarName: pillarConfig.name,
        type: contentType,
        tone,
        language: lang,
        brandVoice,
        topic: topic || undefined,
        context: context || undefined,
      })
      setResult(generated)
    } catch (err: any) {
      setError(err.message || 'Error generating content. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    try {
      const pillarConfig = PILLARS[pillar]
      await saveGeneratedContent({
        userId,
        type: contentType,
        pillar,
        caption: result.caption,
        hashtags: result.hashtags,
        aiPrompt: `${pillarConfig.name} | ${tone} | ${contentType}${topic ? ` | ${topic}` : ''}`,
        title: result.hook,
        hook: result.hook,
        cta: result.cta,
      })
      setSaved(true)
    } catch (err: any) {
      setError(err.message || 'Error saving content.')
    } finally {
      setSaving(false)
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function getFullCaption() {
    if (!result) return ''
    return `${result.hook}\n\n${result.caption}\n\n${result.cta}\n\n${result.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Configuration */}
      <div className="space-y-6">
        {/* Content Type */}
        <div>
          <label className="text-sm font-medium block mb-2">
            {lang === 'de' ? 'Inhaltstyp' : lang === 'es' ? 'Tipo de contenido' : 'Content Type'}
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  contentType === ct.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted border-border hover:border-primary/30'
                }`}
              >
                {ct.label[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Pillar Selection */}
        <div>
          <label className="text-sm font-medium block mb-2">
            {lang === 'de' ? 'Content-Säule' : lang === 'es' ? 'Pilar de contenido' : 'Content Pillar'}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(PILLARS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setPillar(key as ContentPillar)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all ${
                  pillar === key
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-muted border-border hover:border-primary/30'
                }`}
              >
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{config.name}</p>
                  <p className="text-xs text-muted-foreground">{config.description[lang]}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="text-sm font-medium block mb-2">
            {lang === 'de' ? 'Tonalität' : lang === 'es' ? 'Tono' : 'Tone'}
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  tone === t.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted border-border hover:border-primary/30'
                }`}
              >
                {t.emoji} {t.label[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Topic (optional) */}
        <div>
          <label className="text-sm font-medium block mb-2">
            {lang === 'de' ? 'Thema (optional)' : lang === 'es' ? 'Tema (opcional)' : 'Topic (optional)'}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={lang === 'de' ? 'z.B. Morgenroutine, innere Stärke...' : lang === 'es' ? 'Ej: Rutina matutina, fuerza interior...' : 'e.g. Morning routine, inner strength...'}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Context (optional) */}
        <div>
          <label className="text-sm font-medium block mb-2">
            {lang === 'de' ? 'Kontext (optional)' : lang === 'es' ? 'Contexto (opcional)' : 'Context (optional)'}
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={lang === 'de' ? 'Zusätzliche Infos für die KI...' : lang === 'es' ? 'Info adicional para la IA...' : 'Additional info for the AI...'}
            rows={2}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {lang === 'de' ? 'Generiere...' : lang === 'es' ? 'Generando...' : 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {lang === 'de' ? 'Inhalt generieren' : lang === 'es' ? 'Generar contenido' : 'Generate Content'}
            </>
          )}
        </button>
      </div>

      {/* Right: Results */}
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
            {error}
          </div>
        )}

        {!result && !error && !generating && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="font-display text-xl font-bold mb-2">
              {lang === 'de' ? 'KI-Content-Generator' : lang === 'es' ? 'Generador de Contenido IA' : 'AI Content Generator'}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {lang === 'de'
                ? 'Wähle Pilar, Typ und Tonalität und lass die KI Inhalte in deiner Markenstimme erstellen.'
                : lang === 'es'
                ? 'Elige pilar, tipo y tono y deja que la IA cree contenido con tu voz de marca.'
                : 'Choose pillar, type and tone and let AI create content in your brand voice.'}
            </p>
          </div>
        )}

        {generating && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
            <p className="font-bold text-sm">
              {lang === 'de' ? 'Gemini erstellt deinen Inhalt...' : lang === 'es' ? 'Gemini está creando tu contenido...' : 'Gemini is crafting your content...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'de' ? 'Dauert etwa 5-10 Sekunden' : lang === 'es' ? 'Tarda unos 5-10 segundos' : 'Takes about 5-10 seconds'}
            </p>
          </div>
        )}

        {result && !generating && (
          <div className="space-y-4">
            {/* Hook */}
            <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {lang === 'de' ? 'Hook' : lang === 'es' ? 'Gancho' : 'Hook'}
                </span>
                <button onClick={() => handleCopy(result.hook, 'hook')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Copy size={12} />
                  {copied === 'hook' ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="font-display text-lg font-bold">{result.hook}</p>
            </div>

            {/* Caption */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {lang === 'de' ? 'Caption' : lang === 'es' ? 'Caption' : 'Caption'}
                </span>
                <button onClick={() => handleCopy(result.caption, 'caption')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Copy size={12} />
                  {copied === 'caption' ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{result.caption}</p>
            </div>

            {/* CTA */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CTA</span>
                <button onClick={() => handleCopy(result.cta, 'cta')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Copy size={12} />
                  {copied === 'cta' ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="text-sm font-bold text-primary">{result.cta}</p>
            </div>

            {/* Hashtags */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Hashtags
                </span>
                <button onClick={() => handleCopy(result.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' '), 'hashtags')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Copy size={12} />
                  {copied === 'hashtags' ? '✓' : 'Copy'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.hashtags.map((tag, i) => (
                  <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-medium">
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Alternative Captions */}
            {result.alternativeCaptions?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="flex items-center justify-between w-full"
                >
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {lang === 'de' ? 'Alternativen' : lang === 'es' ? 'Alternativas' : 'Alternatives'} ({result.alternativeCaptions.length})
                  </span>
                  {showAlternatives ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showAlternatives && (
                  <div className="mt-3 space-y-3">
                    {result.alternativeCaptions.map((alt, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                          <button onClick={() => handleCopy(alt, `alt-${i}`)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <Copy size={12} />
                            {copied === `alt-${i}` ? '✓' : ''}
                          </button>
                        </div>
                        <p className="text-sm leading-relaxed">{alt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 bg-muted border border-border py-2.5 rounded-xl font-bold text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                {lang === 'de' ? 'Neu generieren' : lang === 'es' ? 'Regenerar' : 'Regenerate'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  '✓'
                ) : (
                  <Save size={14} />
                )}
                {saved
                  ? (lang === 'de' ? 'Gespeichert!' : lang === 'es' ? '¡Guardado!' : 'Saved!')
                  : (lang === 'de' ? 'Als Entwurf speichern' : lang === 'es' ? 'Guardar como borrador' : 'Save as Draft')}
              </button>
            </div>

            {/* Copy Full Caption */}
            <button
              onClick={() => handleCopy(getFullCaption(), 'full')}
              className="w-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 py-2.5 rounded-xl font-bold text-sm hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
            >
              <Copy size={14} />
              {lang === 'de' ? 'Kompletten Beitrag kopieren' : lang === 'es' ? 'Copiar publicación completa' : 'Copy Full Post'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}