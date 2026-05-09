'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PILLARS } from '@/types'
import {
  Upload, Search, Grid3X3, List, Image, Video, FileText, Trash2,
  Download, MoreHorizontal, FolderOpen, Star, Filter, Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

interface AssetItem {
  id: string
  name: string
  type: 'image' | 'video' | 'template' | 'design'
  url: string
  thumbnailUrl: string | null
  folder: string
  pillar: string | null
  tags: string[]
  size: number
  width: number | null
  height: number | null
  status: string
  createdAt: string
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'image' | 'video' | 'template' | 'design'

const FOLDERS = [
  { id: 'all', name: 'Todos', icon: FolderOpen },
  { id: 'general', name: 'General', icon: FolderOpen },
  { id: 'emotional_mastery', name: 'Emotional Mastery', icon: FolderOpen },
  { id: 'systematic_method', name: 'Systematic Method', icon: FolderOpen },
  { id: 'valley_experience', name: 'Valley Experience', icon: FolderOpen },
  { id: 'transformation', name: 'Transformation', icon: FolderOpen },
  { id: 'community', name: 'Community', icon: FolderOpen },
]

const TYPE_FILTERS: { id: FilterType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todos', icon: <Filter size={14} /> },
  { id: 'image', label: 'Imágenes', icon: <Image size={14} /> },
  { id: 'video', label: 'Videos', icon: <Video size={14} /> },
  { id: 'template', label: 'Plantillas', icon: <FileText size={14} /> },
]

// ── Mock data for demo ──────────────────────────────────────────────────────

function getMockAssets(): AssetItem[] {
  return [
    { id: '1', name: 'Foto perfil - sesión otoño', type: 'image', url: '', thumbnailUrl: null, folder: 'transformation', pillar: 'transformation', tags: ['perfil', 'otoño', 'sesión'], size: 2400000, width: 1080, height: 1080, status: 'approved', createdAt: '2026-05-01' },
    { id: '2', name: 'Reel - 5 pasos transformación', type: 'video', url: '', thumbnailUrl: null, folder: 'transformation', pillar: 'transformation', tags: ['reel', 'tips', 'transformación'], size: 15000000, width: 1080, height: 1920, status: 'approved', createdAt: '2026-05-03' },
    { id: '3', name: 'Carousel plantilla tips', type: 'template', url: '', thumbnailUrl: null, folder: 'systematic_method', pillar: 'systematic_method', tags: ['carousel', 'tips', 'plantilla'], size: 500000, width: 1080, height: 1080, status: 'draft', createdAt: '2026-05-05' },
    { id: '4', name: 'Quote - vulnerabilidad', type: 'design', url: '', thumbnailUrl: null, folder: 'emotional_mastery', pillar: 'emotional_mastery', tags: ['quote', 'vulnerabilidad', 'diseño'], size: 800000, width: 1080, height: 1350, status: 'approved', createdAt: '2026-05-06' },
    { id: '5', name: 'Foto comunidad evento', type: 'image', url: '', thumbnailUrl: null, folder: 'community', pillar: 'community', tags: ['comunidad', 'evento', 'foto'], size: 3200000, width: 1080, height: 1080, status: 'approved', createdAt: '2026-05-07' },
    { id: '6', name: 'Video - behind the scenes', type: 'video', url: '', thumbnailUrl: null, folder: 'general', pillar: null, tags: ['bts', 'behind scenes'], size: 25000000, width: 1080, height: 1920, status: 'approved', createdAt: '2026-05-08' },
  ]
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const TYPE_COLORS: Record<string, string> = {
  image: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  video: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  template: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  design: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <Image size={32} />,
  video: <Video size={32} />,
  template: <FileText size={32} />,
  design: <Star size={32} />,
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MediaStudio() {
  const [assets, setAssets] = useState<AssetItem[]>(getMockAssets())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const filteredAssets = assets.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false
    if (selectedFolder !== 'all' && a.folder !== selectedFolder) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files) return
    const supabase = createClient()
    setUploading(true)

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file)

      if (uploadError) {
        console.error('[Upload] Error:', uploadError.message)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('assets').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        folder: selectedFolder === 'all' ? 'general' : selectedFolder,
        storage_path: filePath,
        url: publicUrl,
        size: file.size,
        mime_type: file.type,
        status: 'approved',
      })

      if (dbError) console.error('[Upload] DB error:', dbError.message)
    }

    setUploading(false)
  }, [selectedFolder])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Image size={28} className="text-primary" />
            Media Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organiza, sube y gestiona tus activos visuales
          </p>
        </div>
        <Button className="gap-1.5" disabled={uploading}>
          <Upload size={16} />
          {uploading ? 'Subiendo...' : 'Subir archivos'}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all',
          dragOver ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
      >
        <Upload size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Arrastra archivos aquí o haz clic para subir</p>
        <p className="text-xs text-muted-foreground mt-1">Imágenes y videos · Máximo 50MB por archivo</p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm"
          />
        </div>

        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                filterType === f.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-2 rounded-lg border', viewMode === 'grid' ? 'border-primary bg-primary/10' : 'border-border')}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-2 rounded-lg border', viewMode === 'list' ? 'border-primary bg-primary/10' : 'border-border')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Folder Sidebar */}
        <div className="hidden md:block w-48 space-y-1">
          {FOLDERS.map((folder) => {
            const Icon = folder.icon
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  selectedFolder === folder.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon size={14} />
                {folder.name}
              </button>
            )
          })}
        </div>

        {/* Asset Grid/List */}
        <div className="flex-1">
          {filteredAssets.length === 0 ? (
            <Card className="p-12 text-center">
              <Image size={48} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No hay activos aquí</p>
              <p className="text-sm text-muted-foreground mt-1">Sube archivos o cambia los filtros</p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={cn(
                    'group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg',
                    selectedAsset?.id === asset.id ? 'border-primary' : 'border-transparent'
                  )}
                >
                  {/* Placeholder for actual image */}
                  <div className={cn(
                    'w-full h-full flex flex-col items-center justify-center gap-2',
                    'bg-gradient-to-br from-muted to-muted/50',
                    TYPE_COLORS[asset.type]?.replace('text-', 'text-')
                  )}>
                    {TYPE_ICONS[asset.type]}
                    <span className="text-xs font-medium px-2 text-center line-clamp-2">{asset.name}</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-xs font-medium">Ver detalles</div>
                  </div>

                  {/* Type badge */}
                  <Badge className="absolute top-2 left-2 text-[10px]" variant="secondary">
                    {asset.type}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    selectedAsset?.id === asset.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', TYPE_COLORS[asset.type])}>
                    {TYPE_ICONS[asset.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{asset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {asset.type} · {formatSize(asset.size)} · {asset.pillar ? PILLARS[asset.pillar as keyof typeof PILLARS]?.name || asset.pillar : 'Sin pilar'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{asset.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asset Detail Panel */}
      {selectedAsset && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedAsset.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={TYPE_COLORS[selectedAsset.type]}>{selectedAsset.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatSize(selectedAsset.size)}</span>
                  {selectedAsset.width && selectedAsset.height && (
                    <span className="text-xs text-muted-foreground">{selectedAsset.width}×{selectedAsset.height}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedAsset.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px]">#{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Download size={14} /></Button>
                <Button variant="outline" size="sm" className="text-destructive"><Trash2 size={14} /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}