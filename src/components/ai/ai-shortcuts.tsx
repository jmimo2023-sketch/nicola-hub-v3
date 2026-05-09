'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Sparkles, Hash, Megaphone, Palette, Globe,
  Minus, Plus, Repeat, Zap, PenLine, Copy, Check, Loader2
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

export type ShortcutAction =
  | 'emojify' | 'hashtags' | 'cta' | 'tone_change'
  | 'translate' | 'shorten' | 'lengthen' | 'repurpose' | 'hook' | 'rewrite'

interface ShortcutConfig {
  id: ShortcutAction
  label: { es: string; de: string; en: string }
  icon: React.ReactNode
  color: string
  description: { es: string; de: string; en: string }
  needsInput?: 'tone' | 'language' | 'contentType'
}

const SHORTCUTS: ShortcutConfig[] = [
  { id: 'emojify', label: { es: 'Emojis', de: 'Emojis', en: 'Emojis' }, icon: <Sparkles size={14} />, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: { es: 'Agrega emojis relevantes', de: 'Füge passende Emojis hinzu', en: 'Add relevant emojis' } },
  { id: 'hashtags', label: { es: 'Hashtags', de: 'Hashtags', en: 'Hashtags' }, icon: <Hash size={14} />, color: 'bg-blue-100 text-blue-700 border-blue-200', description: { es: 'Genera hashtags estratégicos', de: 'Generiere strategische Hashtags', en: 'Generate strategic hashtags' } },
  { id: 'cta', label: { es: 'CTA', de: 'CTA', en: 'CTA' }, icon: <Megaphone size={14} />, color: 'bg-green-100 text-green-700 border-green-200', description: { es: 'Agrega llamado a la acción', de: 'Handlungsaufforderung hinzufügen', en: 'Add call to action' } },
  { id: 'tone_change', label: { es: 'Tono', de: 'Ton', en: 'Tone' }, icon: <Palette size={14} />, color: 'bg-purple-100 text-purple-700 border-purple-200', description: { es: 'Cambia el tono', de: 'Ton ändern', en: 'Change tone' }, needsInput: 'tone' },
  { id: 'translate', label: { es: 'Traducir', de: 'Übersetzen', en: 'Translate' }, icon: <Globe size={14} />, color: 'bg-cyan-100 text-cyan-700 border-cyan-200', description: { es: 'Traduce el contenido', de: 'Inhalt übersetzen', en: 'Translate content' }, needsInput: 'language' },
  { id: 'shorten', label: { es: 'Acortar', de: 'Kürzen', en: 'Shorten' }, icon: <Minus size={14} />, color: 'bg-orange-100 text-orange-700 border-orange-200', description: { es: 'Acorta manteniendo el mensaje', de: 'Kürzen ohne Sinnverlust', en: 'Shorten keeping the message' } },
  { id: 'lengthen', label: { es: 'Expandir', de: 'Erweitern', en: 'Lengthen' }, icon: <Plus size={14} />, color: 'bg-pink-100 text-pink-700 border-pink-200', description: { es: 'Expande con más detalle', de: 'Mehr Details hinzufügen', en: 'Expand with more detail' } },
  { id: 'repurpose', label: { es: 'Adaptar', de: 'Anpassen', en: 'Repurpose' }, icon: <Repeat size={14} />, color: 'bg-indigo-100 text-indigo-700 border-indigo-200', description: { es: 'Adapta para Reel/Story/Carousel', de: 'Für Reel/Story/Carousel anpassen', en: 'Adapt for Reel/Story/Carousel' }, needsInput: 'contentType' },
  { id: 'hook', label: { es: 'Ganchos', de: 'Hooks', en: 'Hooks' }, icon: <Zap size={14} />, color: 'bg-red-100 text-red-700 border-red-200', description: { es: 'Genera ganchos impactantes', de: 'Einprägsame Hooks generieren', en: 'Generate scroll-stopping hooks' } },
  { id: 'rewrite', label: { es: 'Reescribir', de: 'Umschreiben', en: 'Rewrite' }, icon: <PenLine size={14} />, color: 'bg-teal-100 text-teal-700 border-teal-200', description: { es: 'Reescribe para más impacto', de: 'Für mehr Wirkung umschreiben', en: 'Rewrite for more impact' } },
]

const TONES = ['vulnerable', 'empowering', 'reflective', 'provocative', 'warm', 'direct']
const LANGUAGES = [
  { code: 'es' as const, label: 'Español' },
  { code: 'de' as const, label: 'Deutsch' },
  { code: 'en' as const, label: 'English' },
]
const CONTENT_TYPES = ['post', 'reel', 'story', 'carousel'] as const

// ── Component ────────────────────────────────────────────────────────────────

interface AIShortcutsProps {
  text: string
  language?: 'es' | 'de' | 'en'
  onResult: (result: string, action: ShortcutAction) => void
}

export function AIShortcuts({ text, language = 'es', onResult }: AIShortcutsProps) {
  const [loading, setLoading] = useState<ShortcutAction | null>(null)
  const [extraInput, setExtraInput] = useState<{ action: ShortcutAction; value: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleShortcut = async (action: ShortcutAction) => {
    if (!text.trim()) return

    // Check if action needs extra input
    const config = SHORTCUTS.find(s => s.id === action)
    if (config?.needsInput && !extraInput) {
      setExtraInput({ action, value: '' })
      return
    }

    setLoading(action)
    try {
      const body: Record<string, string> = {
        action,
        text,
        targetLanguage: language,
      }

      if (extraInput) {
        if (extraInput.action === 'tone_change') body.tone = extraInput.value
        if (extraInput.action === 'translate') body.targetLanguage = extraInput.value
        if (extraInput.action === 'repurpose') body.contentType = extraInput.value
      }

      const res = await fetch('/api/ai/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to apply shortcut')

      const data = await res.json()
      onResult(data.result, action)
    } catch (err) {
      console.error('[Shortcut] Error:', err)
    } finally {
      setLoading(null)
      setExtraInput(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Zap size={14} className="text-primary" />
          Atajos IA
        </h3>
        {text && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(text)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        )}
      </div>

      {/* Extra input for actions that need it */}
      {extraInput && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          {extraInput.action === 'tone_change' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Selecciona el tono:</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map(tone => (
                  <button
                    key={tone}
                    onClick={() => setExtraInput({ ...extraInput, value: tone })}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all',
                      extraInput.value === tone
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          )}
          {extraInput.action === 'translate' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Traducir a:</p>
              <div className="flex gap-2">
                {LANGUAGES.filter(l => l.code !== language).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setExtraInput({ ...extraInput, value: lang.code })}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all',
                      extraInput.value === lang.code
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {extraInput.action === 'repurpose' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Adaptar para:</p>
              <div className="flex gap-2">
                {CONTENT_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setExtraInput({ ...extraInput, value: type })}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all capitalize',
                      extraInput.value === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleShortcut(extraInput.action)} disabled={!extraInput.value || !!loading}>
              Aplicar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExtraInput(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Shortcuts Grid */}
      <div className="flex flex-wrap gap-1.5">
        {SHORTCUTS.map((shortcut) => {
          const isLoading = loading === shortcut.id
          return (
            <button
              key={shortcut.id}
              onClick={() => handleShortcut(shortcut.id)}
              disabled={!!loading || !text.trim()}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all',
                'hover:scale-105 active:scale-95',
                shortcut.color,
                (loading && !isLoading) && 'opacity-50',
                isLoading && 'animate-pulse'
              )}
              title={shortcut.description[language]}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : shortcut.icon}
              {shortcut.label[language]}
            </button>
          )
        })}
      </div>

      {!text.trim() && (
        <p className="text-xs text-muted-foreground text-center">
          Escribe contenido arriba para activar los atajos IA
        </p>
      )}
    </div>
  )
}