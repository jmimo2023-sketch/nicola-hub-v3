'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Scissors, Sparkles, Type, Subtitles as SubtitlesIcon, Wand2, Download,
  Upload, Film, Trash2, Plus, Check, Loader2, Eye, Zap
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FadeIn } from '@/components/ui/motion'

// ── Types ──────────────────────────────────────────────────────────────────

interface VideoSegment {
  id: string
  startTime: number
  endTime: number
  label: string
  score: number // 0-100, AI relevance score
  type: 'highlight' | 'cut' | 'intro' | 'outro' | 'action' | 'emotion' | 'speech'
  caption?: string
  selected: boolean
}

interface SubtitleLine {
  id: string
  startTime: number
  endTime: number
  text: string
  style: 'bottom' | 'center' | 'top'
  fontSize: 'small' | 'medium' | 'large'
  animation: 'none' | 'fade' | 'typewriter' | 'pop'
  color: string
}

interface VideoProject {
  url: string
  name: string
  duration: number
  width: number
  height: number
  segments: VideoSegment[]
  subtitles: SubtitleLine[]
  caption: string
  hashtags: string[]
}

const SEGMENT_COLORS: Record<string, string> = {
  highlight: 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400',
  cut: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400',
  intro: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400',
  outro: 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-400',
  action: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400',
  emotion: 'bg-pink-500/20 border-pink-500 text-pink-700 dark:text-pink-400',
  speech: 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-400',
}

const SEGMENT_LABELS: Record<string, string> = {
  highlight: '⭐ Highlight',
  cut: '✂️ Corte',
  intro: '🎬 Intro',
  outro: '🏁 Outro',
  action: '⚡ Acción',
  emotion: '💜 Emoción',
  speech: '🗣️ Habla',
}

const FORMAT_PRESETS = [
  { id: 'reel-9-16', label: 'Reel 9:16', width: 1080, height: 1920, icon: '📱' },
  { id: 'post-1-1', label: 'Post 1:1', width: 1080, height: 1080, icon: '🔲' },
  { id: 'story-9-16', label: 'Story 9:16', width: 1080, height: 1920, icon: '📲' },
  { id: 'carousel-4-5', label: 'Carousel 4:5', width: 1080, height: 1350, icon: '🎠' },
]

const CAPTION_STYLES = [
  { id: 'minimal', label: 'Minimal', desc: 'Texto limpio en la parte inferior' },
  { id: 'bold-center', label: 'Bold Center', desc: 'Texto grande centrado' },
  { id: 'split', label: 'Split', desc: 'Título arriba + subtítulo abajo' },
  { id: 'typewriter', label: 'Typewriter', desc: 'Texto que aparece letra por letra' },
  { id: 'pop', label: 'Pop', desc: 'Texto que aparece con impacto' },
  { id: 'glow', label: 'Glow', desc: 'Texto con efecto de brillo' },
]

// ── Mock AI Highlight Detection ──────────────────────────────────────────────

function generateMockHighlights(duration: number): VideoSegment[] {
  const segments: VideoSegment[] = []
  const segmentDuration = Math.min(15, duration / 6)

  // Intro
  segments.push({
    id: 'seg-1', startTime: 0, endTime: Math.min(3, duration),
    label: 'Hook / Intro', score: 85, type: 'intro',
    caption: '¿Sabías que...', selected: true
  })

  // Generate highlight segments
  const highlights = [
    { time: duration * 0.15, label: 'Momento emocional', type: 'emotion' as const, score: 78 },
    { time: duration * 0.3, label: 'Punto clave', type: 'highlight' as const, score: 92 },
    { time: duration * 0.45, label: 'Consejo principal', type: 'speech' as const, score: 88 },
    { time: duration * 0.6, label: 'Momento de acción', type: 'action' as const, score: 71 },
    { time: duration * 0.75, label: 'Segundo highlight', type: 'highlight' as const, score: 84 },
  ]

  highlights.forEach((h, i) => {
    if (h.time < duration) {
      segments.push({
        id: `seg-${i + 2}`, startTime: h.time, endTime: Math.min(h.time + segmentDuration, duration),
        label: h.label, score: h.score, type: h.type, selected: h.score >= 80
      })
    }
  })

  // Outro / CTA
  if (duration > 10) {
    segments.push({
      id: `seg-${segments.length + 1}`, startTime: Math.max(0, duration - 5), endTime: duration,
      label: 'CTA / Outro', score: 76, type: 'outro',
      caption: 'Sígueme para más 🔔', selected: true
    })
  }

  return segments
}

// ── Main Component ──────────────────────────────────────────────────────────

export function VideoStudio() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoName, setVideoName] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [segments, setSegments] = useState<VideoSegment[]>([])
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([])
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_PRESETS[0])
  const [captionStyle, setCaptionStyle] = useState('minimal')
  const [activeTab, setActiveTab] = useState<'highlights' | 'subtitles' | 'caption' | 'export'>('highlights')
  const [processing, setProcessing] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [showSubtitleEditor, setShowSubtitleEditor] = useState<string | null>(null)

  // Handle video upload
  const handleVideoUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setVideoName(file.name)
  }, [])

  // When video metadata loads
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      const d = videoRef.current.duration
      setDuration(d)
      if (d > 0) {
        setSegments(generateMockHighlights(d))
      }
    }
  }, [])

  // AI highlight detection
  const detectHighlights = async () => {
    setAiGenerating(true)
    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000))
    if (duration > 0) {
      setSegments(generateMockHighlights(duration))
    }
    setAiGenerating(false)
  }

  // AI subtitle generation
  const generateSubtitles = async () => {
    setAiGenerating(true)
    await new Promise(r => setTimeout(r, 2500))

    if (duration > 0 && segments.length > 0) {
      const newSubs: SubtitleLine[] = segments
        .filter(s => s.selected)
        .map((s, i) => ({
          id: `sub-${i}`,
          startTime: s.startTime,
          endTime: s.endTime,
          text: s.caption || s.label,
          style: 'bottom' as const,
          fontSize: 'medium' as const,
          animation: 'fade' as const,
          color: '#FFFFFF',
        }))
      setSubtitles(newSubs)
    }
    setAiGenerating(false)
  }

  // AI caption generation
  const generateCaption = async () => {
    setAiGenerating(true)
    try {
      const res = await fetch('/api/ai/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hashtags',
          text: videoName || 'video de contenido emocional',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.metadata?.hashtags) {
          setHashtags(data.metadata.hashtags.slice(0, 15))
        }
      }
    } catch (e) {
      console.error('[VideoStudio] Error generating hashtags:', e)
    }

    setCaption('✨ Momento que te hace reflexionar… ¿Alguna vez sentiste que todo podía cambiar en un instante? Este es ese momento. 💜\n\nGuarda este video para cuando lo necesites 📌')
    setAiGenerating(false)
  }

  // Toggle segment selection
  const toggleSegment = (id: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s))
  }

  // Format time
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Compose final video timeline
  const selectedSegments = segments.filter(s => s.selected).sort((a, b) => a.startTime - b.startTime)
  const totalSelectedDuration = selectedSegments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Film size={28} className="text-primary" />
            Video Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Editor inteligente de video con IA — highlights, captions y subtítulos
          </p>
        </div>
        {videoUrl && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Download size={14} /> Exportar
            </Button>
          </div>
        )}
      </div>

      {!videoUrl ? (
        /* ── Upload Zone ────────────────────────────────────────────────── */
        <Card className="p-8">
          <div
            className="border-2 border-dashed rounded-2xl p-16 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            <Upload size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sube tu video</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              La IA detectará automáticamente los mejores momentos, generará subtítulos
              y te ayudará a crear Reels, Stories y Posts optimizados para Instagram
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {FORMAT_PRESETS.map(f => (
                <Badge key={f.id} variant="outline" className="text-xs">
                  {f.icon} {f.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              MP4, MOV, WebM · Máximo 500MB · Hasta 10 minutos
            </p>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleVideoUpload(file)
              }}
            />
          </div>
        </Card>
      ) : (
        /* ── Video Editor ───────────────────────────────────────────────── */
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Left: Video Preview + Timeline */}
          <div className="space-y-4">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="relative bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onLoadedMetadata={handleVideoLoaded}
                  onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="max-h-full max-w-full"
                  muted={isMuted}
                />

                {/* Subtitle overlay */}
                {subtitles.length > 0 && (
                  <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
                    {subtitles
                      .filter(s => currentTime >= s.startTime && currentTime <= s.endTime)
                      .map(s => (
                        <div
                          key={s.id}
                          className={cn(
                            'inline-block px-4 py-2 rounded-lg text-white font-bold',
                            s.fontSize === 'large' ? 'text-2xl' : s.fontSize === 'medium' ? 'text-lg' : 'text-sm',
                            s.animation === 'pop' ? 'animate-bounce' : ''
                          )}
                          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        >
                          {s.text}
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Caption overlay */}
                {caption && activeTab === 'caption' && (
                  <div className="absolute top-4 left-4 right-4 pointer-events-none">
                    <div className="bg-black/60 text-white text-sm p-3 rounded-lg line-clamp-3">
                      {caption}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-3 bg-card border-t flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, currentTime - 5))}>
                  <SkipBack size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => videoRef.current && (isPlaying ? videoRef.current.pause() : videoRef.current.play())}>
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => videoRef.current && (videoRef.current.currentTime = Math.min(duration, currentTime + 5))}>
                  <SkipForward size={14} />
                </Button>
                <div className="flex-1 mx-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => videoRef.current && (videoRef.current.currentTime = parseFloat(e.target.value))}
                    className="w-full h-1 accent-primary cursor-pointer"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                  {fmt(currentTime)} / {fmt(duration)}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => { setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted }}>
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </Button>
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scissors size={16} /> Línea de Tiempo
                  <Badge variant="outline" className="text-[10px]">
                    {selectedSegments.length} seleccionados · {fmt(totalSelectedDuration)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Timeline bar */}
                <div className="relative h-16 bg-muted rounded-lg overflow-hidden mb-3">
                  {segments.map((seg) => {
                    const left = (seg.startTime / duration) * 100
                    const width = ((seg.endTime - seg.startTime) / duration) * 100
                    return (
                      <button
                        key={seg.id}
                        onClick={() => toggleSegment(seg.id)}
                        className={cn(
                          'absolute top-0 bottom-0 border-2 rounded transition-all cursor-pointer',
                          SEGMENT_COLORS[seg.type] || 'bg-gray-500/20 border-gray-500',
                          seg.selected ? 'opacity-100' : 'opacity-30'
                        )}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${seg.label} (${fmt(seg.startTime)} - ${fmt(seg.endTime)})`}
                      >
                        <div className="text-[8px] font-bold px-1 truncate h-full flex items-center">
                          {seg.label}
                        </div>
                      </button>
                    )
                  })}

                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                {/* Segment list */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {segments.sort((a, b) => a.startTime - b.startTime).map((seg) => (
                    <button
                      key={seg.id}
                      onClick={() => {
                        toggleSegment(seg.id)
                        videoRef.current && (videoRef.current.currentTime = seg.startTime)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all',
                        seg.selected ? 'border-primary/30 bg-primary/5' : 'border-border/50 opacity-60'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                        seg.score >= 80 ? 'bg-green-100 text-green-700' :
                        seg.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {seg.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{SEGMENT_LABELS[seg.type] || seg.label}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {fmt(seg.startTime)} - {fmt(seg.endTime)} · {fmt(seg.endTime - seg.startTime)}
                        </div>
                      </div>
                      {seg.selected ? <Check size={14} className="text-primary shrink-0" /> : <div className="w-3.5" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Control Panel */}
          <div className="space-y-4">
            {/* Format Selection */}
            <Card>
              <CardContent className="p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Formato de Salida</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {FORMAT_PRESETS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f)}
                      className={cn(
                        'p-2 rounded-lg border text-left transition-all text-xs',
                        selectedFormat.id === f.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <span className="text-base">{f.icon}</span>
                      <div className="font-medium mt-0.5">{f.label}</div>
                      <div className="text-[10px] text-muted-foreground">{f.width}×{f.height}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="highlights" className="text-[10px] px-1">
                  <Eye size={10} className="mr-0.5" /> Highlights
                </TabsTrigger>
                <TabsTrigger value="subtitles" className="text-[10px] px-1">
                  <SubtitlesIcon size={10} className="mr-0.5" /> Subs
                </TabsTrigger>
                <TabsTrigger value="caption" className="text-[10px] px-1">
                  <Type size={10} className="mr-0.5" /> Caption
                </TabsTrigger>
                <TabsTrigger value="export" className="text-[10px] px-1">
                  <Download size={10} className="mr-0.5" /> Export
                </TabsTrigger>
              </TabsList>

              {/* Highlights Tab */}
              <TabsContent value="highlights" className="mt-3 space-y-3">
                <Button className="w-full gap-1.5" onClick={detectHighlights} disabled={aiGenerating}>
                  {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {aiGenerating ? 'Analizando...' : 'Detectar Highlights con IA'}
                </Button>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    La IA detectó {segments.filter(s => s.score >= 80).length} momentos destacados.
                    Selecciona los que quieras incluir:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {segments.filter(s => s.selected).length > 0 && (
                      <Badge className="bg-primary/10 text-primary border-0 text-xs">
                        {fmt(totalSelectedDuration)} seleccionados
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-lg">
                  <strong>Consejo:</strong> Un Reel ideal dura 15-30 segundos.
                  Un Story highlight: 5-15 segundos. Selecciona tus mejores momentos.
                </div>
              </TabsContent>

              {/* Subtitles Tab */}
              <TabsContent value="subtitles" className="mt-3 space-y-3">
                <Button className="w-full gap-1.5" onClick={generateSubtitles} disabled={aiGenerating}>
                  {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <SubtitlesIcon size={14} />}
                  {aiGenerating ? 'Generando...' : 'Generar Subtítulos con IA'}
                </Button>

                {subtitles.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {subtitles.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted text-xs">
                        <span className="text-muted-foreground font-mono">{fmt(sub.startTime)}</span>
                        <span className="flex-1 truncate">{sub.text}</span>
                        <select
                          value={sub.style}
                          onChange={(e) => setSubtitles(prev => prev.map(s => s.id === sub.id ? { ...s, style: e.target.value as any } : s))}
                          className="bg-background border border-border rounded text-[10px] px-1 py-0.5"
                        >
                          <option value="bottom">Abajo</option>
                          <option value="center">Centro</option>
                          <option value="top">Arriba</option>
                        </select>
                        <select
                          value={sub.animation}
                          onChange={(e) => setSubtitles(prev => prev.map(s => s.id === sub.id ? { ...s, animation: e.target.value as any } : s))}
                          className="bg-background border border-border rounded text-[10px] px-1 py-0.5"
                        >
                          <option value="fade">Fade</option>
                          <option value="pop">Pop</option>
                          <option value="typewriter">Typewriter</option>
                          <option value="none">Sin animación</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Caption Tab */}
              <TabsContent value="caption" className="mt-3 space-y-3">
                <Button className="w-full gap-1.5" onClick={generateCaption} disabled={aiGenerating}>
                  {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  {aiGenerating ? 'Generando...' : 'Generar Caption con IA'}
                </Button>

                <div>
                  <label className="text-xs font-medium mb-1.5 block">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escribe o genera un caption con IA..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none"
                  />
                  <div className="text-xs text-muted-foreground mt-1">{caption.length}/2200 caracteres</div>
                </div>

                {hashtags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">Hashtags</label>
                    <div className="flex flex-wrap gap-1">
                      {hashtags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium mb-1.5 block">Estilo de Caption</label>
                  <div className="space-y-1.5">
                    {CAPTION_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setCaptionStyle(style.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all',
                          captionStyle === style.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                          captionStyle === style.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          Aa
                        </div>
                        <div>
                          <div className="text-xs font-medium">{style.label}</div>
                          <div className="text-[10px] text-muted-foreground">{style.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="mt-3 space-y-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-3 space-y-3">
                    <h4 className="text-xs font-semibold">Resumen de Exportación</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Formato:</span>
                        <span className="font-medium">{selectedFormat.icon} {selectedFormat.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolución:</span>
                        <span className="font-medium">{selectedFormat.width}×{selectedFormat.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Segmentos:</span>
                        <span className="font-medium">{selectedSegments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duración total:</span>
                        <span className="font-medium">{fmt(totalSelectedDuration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtítulos:</span>
                        <span className="font-medium">{subtitles.length} líneas</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estilo caption:</span>
                        <span className="font-medium">{CAPTION_STYLES.find(s => s.id === captionStyle)?.label}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full gap-1.5" size="lg">
                  <Download size={16} /> Exportar Video
                </Button>

                <p className="text-[10px] text-muted-foreground text-center">
                  El video se procesará en el servidor y se descargará automáticamente cuando esté listo.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
}
