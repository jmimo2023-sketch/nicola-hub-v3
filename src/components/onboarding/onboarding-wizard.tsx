'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useUIStore } from '@/stores'
import { PILLARS, type ContentPillar } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sparkles, ArrowRight, ArrowLeft, Check, Globe, Palette, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const languages = [
  { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
  { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
]

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user, loading: authLoading } = useAuth()
  const { language, setLanguage } = useUIStore()
  const [step, setStep] = useState(0)
  const [selectedPillars, setSelectedPillars] = useState<ContentPillar[]>([])
  const [brandTone, setBrandTone] = useState<string>('vulnerable')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 3

  const togglePillar = (pillar: ContentPillar) => {
    setSelectedPillars(prev => 
      prev.includes(pillar) 
        ? prev.filter(p => p !== pillar)
        : prev.length < 3 
          ? [...prev, pillar]
          : prev
    )
  }

  const handleComplete = async () => {
    setSaving(true)
    setError(null)

    const userId = user?.id
    if (!userId) {
      console.error('[Onboarding] No user ID available')
      setError('No se pudo guardar: sesión no disponible. Intenta recargar la página.')
      setSaving(false)
      return
    }

    try {
      const supabase = createClient()

      const brandVoiceData = {
        pillars: selectedPillars.length > 0 ? selectedPillars : ['emotional_mastery'],
        tone: brandTone,
        emoji_style: 'moderate',
        hashtag_strategy: 'mixed',
        include_cta: true,
        include_hook: true,
        max_hashtags: 15,
      }

      // Try update first
      const { error: updateError } = await supabase.from('profiles').update({
        language,
        onboarding_completed: true,
        brand_voice: brandVoiceData,
      }).eq('user_id', userId)

      if (updateError) {
        console.warn('[Onboarding] Update failed, trying upsert:', updateError.message)
        // If update fails (profile might not exist), try upsert
        const { error: upsertError } = await supabase.from('profiles').upsert({
          user_id: userId,
          display_name: user?.email?.split('@')[0] || 'User',
          language,
          onboarding_completed: true,
          brand_voice: brandVoiceData,
        }, { onConflict: 'user_id' })

        if (upsertError) {
          console.error('[Onboarding] Upsert also failed:', upsertError.message)
          setError('Error al guardar. Intenta de nuevo.')
          setSaving(false)
          return
        }
      }

      console.log('[Onboarding] Profile saved successfully')
    } catch (err) {
      console.error('[Onboarding] Unexpected error:', err)
      setError('Error inesperado. Intenta de nuevo.')
      setSaving(false)
      return
    }

    setSaving(false)
    onComplete()
  }

  // Show loading while auth is hydrating
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {language === 'de' ? 'Laden...' : language === 'es' ? 'Cargando...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-border'
              )}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Step 0: Language */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe size={28} className="text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">
                {language === 'de' ? 'Wähle deine Sprache' : language === 'es' ? 'Elige tu idioma' : 'Choose your language'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {language === 'de' ? 'Du kannst es jederzeit ändern' : language === 'es' ? 'Puedes cambiarlo en cualquier momento' : 'You can change it anytime'}
              </p>
            </div>
            <div className="space-y-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left',
                    language === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-bold">{lang.label}</span>
                  {language === lang.code && <Check size={18} className="ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Content Pillars */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">
                {language === 'de' ? 'Deine Content-Säulen' : language === 'es' ? 'Tus pilares de contenido' : 'Your content pillars'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {language === 'de' ? 'Wähle 2-3 Säulen die dich definieren' : language === 'es' ? 'Elige 2-3 pilares que te definan' : 'Choose 2-3 pillars that define you'}
              </p>
            </div>
            <div className="space-y-3">
              {(Object.entries(PILLARS) as [ContentPillar, typeof PILLARS[ContentPillar]][]).map(([key, pillar]) => (
                <button
                  key={key}
                  onClick={() => togglePillar(key)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left',
                    selectedPillars.includes(key)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <span className="text-2xl">{pillar.emoji}</span>
                  <div className="flex-1">
                    <span className="font-bold block">{pillar.name}</span>
                    <span className="text-xs text-muted-foreground">{pillar.description[language]}</span>
                  </div>
                  {selectedPillars.includes(key) && <Check size={18} className="text-primary" />}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {language === 'de' ? `${selectedPillars.length}/3 ausgewählt` : language === 'es' ? `${selectedPillars.length}/3 seleccionados` : `${selectedPillars.length}/3 selected`}
            </p>
          </div>
        )}

        {/* Step 2: Brand Tone */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette size={28} className="text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">
                {language === 'de' ? 'Deine Markenstimme' : language === 'es' ? 'Tu voz de marca' : 'Your brand voice'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {language === 'de' ? 'Wie sprichst du mit deiner Community?' : language === 'es' ? '¿Cómo hablas con tu comunidad?' : 'How do you speak to your community?'}
              </p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'vulnerable', label: language === 'de' ? 'Verletzlich & Echt' : language === 'es' ? 'Vulnerable & Real' : 'Vulnerable & Real', desc: language === 'de' ? 'Roh, ehrlich, tiefgründig' : language === 'es' ? 'Crudo, honesto, profundo' : 'Raw, honest, deep' },
                { id: 'empowering', label: language === 'de' ? 'Stärkend' : language === 'es' ? 'Empoderador' : 'Empowering', desc: language === 'de' ? 'Stark, aufbauend, motivierend' : language === 'es' ? 'Fuerte, edificante, motivador' : 'Strong, uplifting, motivating' },
                { id: 'reflective', label: language === 'de' ? 'Nachdenklich' : language === 'es' ? 'Reflexivo' : 'Reflective', desc: language === 'de' ? 'Philosophisch, fragend, tiefgründig' : language === 'es' ? 'Filosófico, cuestionador, profundo' : 'Philosophical, questioning, deep' },
                { id: 'warm', label: language === 'de' ? 'Warm & Einladend' : language === 'es' ? 'Cálido & Acogedor' : 'Warm & Inviting', desc: language === 'de' ? 'Wie ein guter Freund, sicher, mitfühlend' : language === 'es' ? 'Como un buen amigo, seguro, compasivo' : 'Like a close friend, safe, compassionate' },
              ].map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setBrandTone(tone.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left',
                    brandTone === tone.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className="flex-1">
                    <span className="font-bold block">{tone.label}</span>
                    <span className="text-xs text-muted-foreground">{tone.desc}</span>
                  </div>
                  {brandTone === tone.id && <Check size={18} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
              <ArrowLeft size={16} className="mr-2" />
              {language === 'de' ? 'Zurück' : language === 'es' ? 'Atrás' : 'Back'}
            </Button>
          ) : (
            <div />
          )}
          
          {step < totalSteps - 1 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && selectedPillars.length < 1}
            >
              {language === 'de' ? 'Weiter' : language === 'es' ? 'Siguiente' : 'Next'}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={saving}
            >
              {saving 
                ? (language === 'de' ? 'Speichern...' : language === 'es' ? 'Guardando...' : 'Saving...')
                : (language === 'de' ? "Los geht's!" : language === 'es' ? '¡Empezar!' : "Let's go!")
              }
              {!saving && <Sparkles size={16} className="ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}