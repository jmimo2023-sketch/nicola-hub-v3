import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Upload, Image, Film, FileText, Palette } from 'lucide-react'

export default async function AssetsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  const lang = (profile?.language || locale || 'es') as 'es' | 'de' | 'en'

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { es: 'Assets', de: 'Assets', en: 'Assets' },
      subtitle: { es: 'Gestiona tus imágenes, videos y plantillas', de: 'Verwalte deine Bilder, Videos und Vorlagen', en: 'Manage your images, videos, and templates' },
      upload: { es: 'Subir Archivo', de: 'Datei hochladen', en: 'Upload File' },
      allAssets: { es: 'Todos', de: 'Alle', en: 'All' },
      images: { es: 'Imágenes', de: 'Bilder', en: 'Images' },
      videos: { es: 'Videos', de: 'Videos', en: 'Videos' },
      templates: { es: 'Plantillas', de: 'Vorlagen', en: 'Templates' },
      designs: { es: 'Diseños', de: 'Designs', en: 'Designs' },
      noAssets: { es: 'No hay assets aún', de: 'Noch keine Assets', en: 'No assets yet' },
      uploadFirst: { es: 'Sube tu primer archivo para usarlo en tu contenido', de: 'Lade deine erste Datei hoch um sie in Inhalten zu nutzen', en: 'Upload your first file to use in content' },
    }
    return translations[key]?.[lang] || key
  }

  const typeIcon: Record<string, any> = { image: Image, video: Film, template: FileText, design: Palette }
  const typeLabel: Record<string, Record<string, string>> = {
    image: { es: 'Imagen', de: 'Bild', en: 'Image' },
    video: { es: 'Video', de: 'Video', en: 'Video' },
    template: { es: 'Plantilla', de: 'Vorlage', en: 'Template' },
    design: { es: 'Diseño', de: 'Design', en: 'Design' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FolderOpen size={24} className="text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Upload size={16} />
          {t('upload')}
        </button>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: t('allAssets') },
          { key: 'image', label: t('images') },
          { key: 'video', label: t('videos') },
          { key: 'template', label: t('templates') },
          { key: 'design', label: t('designs') },
        ].map(filter => (
          <button key={filter.key} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            filter.key === 'all' ? 'bg-primary text-white border-primary' : 'bg-muted border-border hover:border-primary/30'
          }`}>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      {assets && assets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset: any) => {
            const Icon = typeIcon[asset.type] || FileText
            return (
              <div key={asset.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors group">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {asset.url ? (
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon size={32} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">{typeLabel[asset.type]?.[lang] || asset.type}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <FolderOpen size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-bold text-muted-foreground">{t('noAssets')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t('uploadFirst')}</p>
        </div>
      )}
    </div>
  )
}