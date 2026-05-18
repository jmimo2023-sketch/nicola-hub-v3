'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useUIStore } from '@/stores'
import { InstagramConnect } from '@/components/instagram/instagram-connect'
import { Button } from '@/components/ui/button'
import { Save, Globe, Palette, LogOut, Check } from 'lucide-react'
import { InstagramIcon } from '@/components/ui/instagram-icon'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { ConnectionCardSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { ContentPillar } from '@/types'
import { PILLARS } from '@/types'

const languages = [
  { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
  { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
]

export function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { language, setLanguage } = useUIStore()
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [brandVoiceText, setBrandVoiceText] = useState('')
  const [selectedPillars, setSelectedPillars] = useState<ContentPillar[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '')
      const bv = profile.brandVoice as any
      if (bv?.tone) setBrandVoiceText(bv.tone)
      if (bv?.pillars) setSelectedPillars(bv.pillars)
    }
  }, [profile])

  async function handleSave() {
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          language,
          brand_voice: {
            pillars: selectedPillars,
            tone: brandVoiceText,
            emoji_style: 'moderate',
            hashtag_strategy: 'mixed',
            include_cta: true,
            include_hook: true,
            max_hashtags: 15,
          },
        })
        .eq('user_id', user?.id)

      setSaved(true)
      toast.success(l.saved)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar ajustes')
    }
    setSaving(false)
  }

  const togglePillar = (pillar: ContentPillar) => {
    setSelectedPillars((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : prev.length < 3 ? [...prev, pillar] : prev
    )
  }

  const l = {
    title: language === 'de' ? 'Einstellungen' : language === 'es' ? 'Ajustes' : 'Settings',
    profile: language === 'de' ? 'Profil' : language === 'es' ? 'Perfil' : 'Profile',
    name: language === 'de' ? 'Anzeigename' : language === 'es' ? 'Nombre' : 'Display Name',
    lang: language === 'de' ? 'Sprache' : language === 'es' ? 'Idioma' : 'Language',
    brandVoice: language === 'de' ? 'Markenstimme' : language === 'es' ? 'Voz de marca' : 'Brand Voice',
    brandPlaceholder: language === 'de' ? 'z.B. warm, inspirierend, authentisch...' : language === 'es' ? 'Ej: cálida, inspiradora, auténtica...' : 'e.g., warm, inspiring, authentic...',
    pillars: language === 'de' ? 'Content-Säulen' : language === 'es' ? 'Pilares de contenido' : 'Content Pillars',
    igSection: language === 'de' ? 'Instagram-Verbindung' : language === 'es' ? 'Conexión de Instagram' : 'Instagram Connection',
    save: language === 'de' ? 'Speichern' : language === 'es' ? 'Guardar' : 'Save',
    saving: language === 'de' ? 'Speichern...' : language === 'es' ? 'Guardando...' : 'Saving...',
    saved: language === 'de' ? 'Gespeichert!' : language === 'es' ? '¡Guardado!' : 'Saved!',
    signOut: language === 'de' ? 'Abmelden' : language === 'es' ? 'Cerrar sesión' : 'Sign out',
  }

  return (
    <StaggerContainer className="space-y-6 max-w-2xl">
      <StaggerItem>
        <h1 className="font-display text-2xl font-bold">{l.title}</h1>
      </StaggerItem>

      {/* Instagram Connection */}
      <StaggerItem>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <InstagramIcon size={20} className="text-primary" />
            <h2 className="font-bold">{l.igSection}</h2>
          </div>
          {user && <InstagramConnect userId={user.id} />}
        </div>
      </StaggerItem>

      {/* Profile */}
      <StaggerItem>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold">{l.profile}</h2>
          <div>
            <label className="text-sm font-medium block mb-1.5">{l.name}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </StaggerItem>

      {/* Language */}
      <StaggerItem>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Globe size={20} className="text-primary" />
            <h2 className="font-bold">{l.lang}</h2>
          </div>
          <div className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  language === lang.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium text-sm">{lang.label}</span>
                {language === lang.code && <Check size={16} className="ml-auto text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </StaggerItem>

      {/* Brand Voice */}
      <StaggerItem>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-primary" />
            <h2 className="font-bold">{l.brandVoice}</h2>
          </div>
          <textarea
            value={brandVoiceText}
            onChange={(e) => setBrandVoiceText(e.target.value)}
            placeholder={l.brandPlaceholder}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none resize-none"
            rows={3}
          />
        </div>
      </StaggerItem>

      {/* Pillars */}
      <StaggerItem>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold">{l.pillars}</h2>
          <div className="space-y-2">
            {(Object.entries(PILLARS) as [ContentPillar, typeof PILLARS[ContentPillar]][]).map(([key, pillar]) => (
              <button
                key={key}
                onClick={() => togglePillar(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedPillars.includes(key) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-lg">{pillar.emoji}</span>
                <div className="text-left">
                  <span className="font-medium text-sm block">{pillar.name}</span>
                  <span className="text-xs text-muted-foreground">{pillar.description[language]}</span>
                </div>
                {selectedPillars.includes(key) && <Check size={16} className="ml-auto text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </StaggerItem>

      {/* Save + Sign out */}
      <StaggerItem>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <>{l.saving}</> : saved ? <><Check size={16} className="mr-2" />{l.saved}</> : <><Save size={16} className="mr-2" />{l.save}</>}
          </Button>
          <Button variant="outline" onClick={signOut}>
            <LogOut size={16} className="mr-2" />
            {l.signOut}
          </Button>
        </div>
      </StaggerItem>
    </StaggerContainer>
  )
}