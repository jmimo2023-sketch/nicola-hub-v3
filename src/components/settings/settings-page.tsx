'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings as SettingsIcon, User, Globe, Palette, LogOut, Loader2 } from 'lucide-react'
import { PILLARS, type ContentPillar } from '@/types'

interface SettingsPageProps {
  profile: any
  userId: string
  locale: string
}

export function SettingsPage({ profile, userId, locale }: SettingsPageProps) {
  const lang = (profile?.language || locale || 'es') as 'es' | 'de' | 'en'
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [language, setLanguage] = useState<'es' | 'de' | 'en'>(lang)
  const [selectedPillars, setSelectedPillars] = useState<string[]>(
    profile?.brand_voice?.pillars || []
  )
  const [brandVoiceDesc, setBrandVoiceDesc] = useState(
    typeof profile?.brand_voice === 'string' ? profile.brand_voice :
    profile?.brand_voice?.description || ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        language: language,
        brand_voice: {
          description: brandVoiceDesc,
          pillars: selectedPillars,
        },
        onboarding_completed: true,
      })
      .eq('user_id', userId)

    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function togglePillar(pillar: string) {
    setSelectedPillars(prev =>
      prev.includes(pillar)
        ? prev.filter(p => p !== pillar)
        : [...prev, pillar]
    )
  }

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { es: 'Ajustes', de: 'Einstellungen', en: 'Settings' },
      subtitle: { es: 'Personaliza tu experiencia', de: 'Personalisiere dein Erlebnis', en: 'Customize your experience' },
      profile: { es: 'Perfil', de: 'Profil', en: 'Profile' },
      displayName: { es: 'Nombre', de: 'Name', en: 'Display Name' },
      language: { es: 'Idioma', de: 'Sprache', en: 'Language' },
      brandVoice: { es: 'Voz de Marca', de: 'Markenstimme', en: 'Brand Voice' },
      brandVoiceDesc: { es: 'Describe tu estilo y tono...', de: 'Beschreibe deinen Stil und Ton...', en: 'Describe your style and tone...' },
      pillars: { es: 'Pilares de contenido', de: 'Content-Säulen', en: 'Content Pillars' },
      save: { es: 'Guardar', de: 'Speichern', en: 'Save' },
      saved: { es: '¡Guardado!', de: 'Gespeichert!', en: 'Saved!' },
      signOut: { es: 'Cerrar sesión', de: 'Abmelden', en: 'Sign out' },
      email: { es: 'Email', de: 'E-Mail', en: 'Email' },
    }
    return translations[key]?.[lang] || key
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <SettingsIcon size={24} className="text-primary" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">{error}</div>
      )}
      {saved && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-500">{t('saved')}</div>
      )}

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold flex items-center gap-2"><User size={18} /> {t('profile')}</h2>
        <div>
          <label className="text-sm font-medium block mb-1.5">{t('email')}</label>
          <input type="email" value={profile?.user_id || ''} disabled className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm opacity-50" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">{t('displayName')}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold flex items-center gap-2"><Globe size={18} /> {t('language')}</h2>
        <div className="flex gap-3">
          {[
            { value: 'es', label: '🇪🇸 Español' },
            { value: 'de', label: '🇩🇪 Deutsch' },
            { value: 'en', label: '🇬🇧 English' },
          ].map(langOption => (
            <button
              key={langOption.value}
              onClick={() => setLanguage(langOption.value as 'es' | 'de' | 'en')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                language === langOption.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-muted border-border hover:border-primary/30'
              }`}
            >
              {langOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Voice */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold flex items-center gap-2"><Palette size={18} /> {t('brandVoice')}</h2>
        <div>
          <label className="text-sm font-medium block mb-1.5">{t('brandVoiceDesc')}</label>
          <textarea
            value={brandVoiceDesc}
            onChange={(e) => setBrandVoiceDesc(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors resize-none"
            placeholder={lang === 'de' ? 'z.B.: Warm, inspirierend, authentisch...' : lang === 'es' ? 'Ej: Cálida, inspiradora, auténtica...' : 'e.g.: Warm, inspiring, authentic...'}
          />
        </div>
      </div>

      {/* Pillars */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold">{t('pillars')}</h2>
        <div className="space-y-2">
          {Object.entries(PILLARS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => togglePillar(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all ${
                selectedPillars.includes(key)
                  ? 'bg-primary/10 border-primary'
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

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? '...' : t('save')}
        </button>
        <button
          onClick={handleSignOut}
          className="px-6 py-3 border border-red-500/30 text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2"
        >
          <LogOut size={16} />
          {t('signOut')}
        </button>
      </div>
    </div>
  )
}