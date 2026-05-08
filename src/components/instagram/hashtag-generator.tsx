'use client'

import { useState } from 'react'
import { Hash, Sparkles, Copy, Check, RefreshCw } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

interface HashtagResult {
  high: string[]
  medium: string[]
  niche: string[]
  all: string[]
}

export function HashtagGenerator({ language, pillar }: { language: string; pillar: string }) {
  const [topic, setTopic] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HashtagResult | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/instagram/hashtag-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, pillar, language, caption }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function copyHashtags() {
    if (!result) return
    await navigator.clipboard.writeText(result.all.join(' '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const labels = {
    title: language === 'de' ? 'Hashtag-Generator' : language === 'es' ? 'Generador de Hashtags' : 'Hashtag Generator',
    placeholder: language === 'de' ? 'Thema oder Schlüsselwort...' : language === 'es' ? 'Tema o palabra clave...' : 'Topic or keyword...',
    generate: language === 'de' ? 'Generieren' : language === 'es' ? 'Generar' : 'Generate',
    highVol: language === 'de' ? 'Hohes Volumen' : language === 'es' ? 'Alto volumen' : 'High volume',
    medVol: language === 'de' ? 'Mittleres Volumen' : language === 'es' ? 'Medio volumen' : 'Medium volume',
    nicheVol: language === 'de' ? 'Nischen-Hashtags' : language === 'es' ? 'Hashtags de nicho' : 'Niche hashtags',
    copy: language === 'de' ? 'Kopieren' : language === 'es' ? 'Copiar' : 'Copy',
    copied: '✓',
    captionPlaceholder: language === 'de' ? 'Caption (optional)...' : language === 'es' ? 'Caption (opcional)...' : 'Caption (optional)...',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Hash size={20} className="text-primary" />
        <h3 className="font-bold">{labels.title}</h3>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={labels.placeholder}
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && generate()}
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={labels.captionPlaceholder}
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none resize-none"
          rows={2}
        />
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {labels.generate}
        </button>
      </div>

      {result && (
        <FadeIn>
          <div className="space-y-4">
            {/* Copy all button */}
            <button
              onClick={copyHashtags}
              className="w-full flex items-center justify-center gap-2 p-3 bg-muted border border-border rounded-xl text-sm hover:bg-accent transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? labels.copied : `${labels.copy} (${result.all.length})`}
            </button>

            <StaggerContainer className="space-y-3">
              {/* High volume */}
              {result.high.length > 0 && (
                <StaggerItem>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{labels.highVol}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.high.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}

              {/* Medium volume */}
              {result.medium.length > 0 && (
                <StaggerItem>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{labels.medVol}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.medium.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-medium text-purple-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}

              {/* Niche */}
              {result.niche.length > 0 && (
                <StaggerItem>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{labels.nicheVol}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.niche.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-medium text-green-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}
            </StaggerContainer>
          </div>
        </FadeIn>
      )}
    </div>
  )
}