'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useUIStore } from '@/stores'
import {
  MessageCircle, Send, Sparkles, Eye, EyeOff, Trash2, Copy, Check,
  ChevronDown, Inbox, Mail, MessageSquare, Filter, RefreshCw
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { InstagramIcon } from '@/components/ui/instagram-icon'

interface InboxItem {
  id: string
  type: 'comment' | 'dm'
  sender_name: string
  sender_username?: string
  text: string
  timestamp: string
  media_caption?: string
  media_permalink?: string
  media_url?: string
  is_read?: boolean
  is_replied?: boolean
  like_count?: number
  replies?: any[]
  conversation_id?: string
}

interface SavedReply {
  id: string
  name: string
  text: string
  category: string
  usage_count: number
}

export function InboxPage() {
  const { user } = useAuth()
  const { language } = useUIStore()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [replyText, setReplyText] = useState('')
  const [smartReplies, setSmartReplies] = useState<string[]>([])
  const [generatingReplies, setGeneratingReplies] = useState(false)
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([])
  const [filter, setFilter] = useState<'all' | 'comments' | 'dms'>('all')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const l = {
    title: language === 'de' ? 'Posteingang' : language === 'es' ? 'Bandeja de entrada' : 'Inbox',
    subtitle: language === 'de' ? 'Kommentare und Nachrichten' : language === 'es' ? 'Comentarios y mensajes' : 'Comments and messages',
    noConnection: language === 'de' ? 'Instagram nicht verbunden' : language === 'es' ? 'Instagram no conectado' : 'Instagram not connected',
    noConnectionDesc: language === 'de' ? 'Verbinde Instagram, um Kommentare und Nachrichten zu sehen' : language === 'es' ? 'Conecta Instagram para ver comentarios y mensajes' : 'Connect Instagram to see comments and messages',
    noItems: language === 'de' ? 'Keine Nachrichten' : language === 'es' ? 'Sin mensajes' : 'No messages',
    smartReplies: language === 'de' ? 'KI-Antworten' : language === 'es' ? 'Respuestas IA' : 'AI Replies',
    savedReplies: language === 'de' ? 'Gespeicherte Antworten' : language === 'es' ? 'Respuestas guardadas' : 'Saved Replies',
    reply: language === 'de' ? 'Antworten' : language === 'es' ? 'Responder' : 'Reply',
    send: language === 'de' ? 'Senden' : language === 'es' ? 'Enviar' : 'Send',
    typeReply: language === 'de' ? 'Antwort schreiben...' : language === 'es' ? 'Escribe tu respuesta...' : 'Type your reply...',
    hide: language === 'de' ? 'Ausblenden' : language === 'es' ? 'Ocultar' : 'Hide',
    delete: language === 'de' ? 'Löschen' : language === 'es' ? 'Eliminar' : 'Delete',
    generating: language === 'de' ? 'Generiere...' : language === 'es' ? 'Generando...' : 'Generating...',
    all: language === 'de' ? 'Alle' : language === 'es' ? 'Todos' : 'All',
    comments: language === 'de' ? 'Kommentare' : language === 'es' ? 'Comentarios' : 'Comments',
    dms: language === 'de' ? 'Nachrichten' : language === 'es' ? 'Mensajes' : 'DMs',
  }

  useEffect(() => {
    checkConnection()
    loadSavedReplies()
  }, [])

  async function checkConnection() {
    const supabase = createClient()
    const { data } = await supabase
      .from('meta_connections')
      .select('ig_user_id')
      .eq('user_id', user?.id)
      .single()
    setIsConnected(!!data)
    if (data) loadInbox()
    else setLoading(false)
  }

  async function loadInbox() {
    setLoading(true)
    try {
      const res = await fetch(`/api/instagram/inbox?type=${filter}`)
      if (res.ok) {
        const data = await res.json()
        const allItems: InboxItem[] = [
          ...(data.comments || []).map((c: any) => ({
            id: c.id,
            type: 'comment' as const,
            sender_name: c.from?.name || c.from?.username || 'User',
            sender_username: c.from?.username,
            text: c.text,
            timestamp: c.timestamp,
            media_caption: c.media?.caption,
            media_permalink: c.media?.permalink,
            media_url: c.media?.media_url,
            like_count: c.like_count,
            replies: c.replies?.data,
          })),
          ...(data.dms || []).flatMap((conv: any) =>
            (conv.messages || []).map((m: any) => ({
              id: m.id,
              type: 'dm' as const,
              sender_name: m.from?.name || 'User',
              sender_username: m.from?.username,
              text: m.message || m.text,
              timestamp: m.created_time,
              conversation_id: conv.id,
            }))
          ),
        ]
        allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setItems(allItems)
      }
    } catch {}
    setLoading(false)
  }

  async function loadSavedReplies() {
    const supabase = createClient()
    const { data } = await supabase
      .from('reply_templates')
      .select('*')
      .eq('user_id', user?.id)
      .order('usage_count', { ascending: false })

    if (data && data.length > 0) {
      setSavedReplies(data)
    } else {
      setSavedReplies([
        { id: '1', name: 'Gracias ❤️', text: '¡Gracias por tu mensaje! Me alegra mucho leerte 💚', category: 'gratitude', usage_count: 0 },
        { id: '2', name: 'Te leo 🙏', text: 'Te leo y te siento. Gracias por compartir 🙏', category: 'empathy', usage_count: 0 },
        { id: '3', name: 'Link en bio 📅', text: 'Toda la info está en mi link en bio 📅✨', category: 'info', usage_count: 0 },
        { id: '4', name: 'Coaching 🦋', text: 'DM para info sobre coaching privado 🦋', category: 'sales', usage_count: 0 },
        { id: '5', name: 'Respira 🧘‍♀️', text: 'Respira hondo. Todo va a estar bien 🧘‍♀️💚', category: 'wellness', usage_count: 0 },
      ])
    }
  }

  async function generateSmartReplies() {
    if (!selectedItem) return
    setGeneratingReplies(true)
    try {
      const res = await fetch('/api/instagram/smart-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: selectedItem.text, language }),
      })
      const data = await res.json()
      setSmartReplies(data.replies || [])
    } catch {}
    setGeneratingReplies(false)
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedItem) return
    setSending(true)
    try {
      const action = selectedItem.type === 'comment' ? 'reply_comment' : 'send_dm'
      const body: any = { action, message: replyText }
      if (selectedItem.type === 'comment') {
        body.commentId = selectedItem.id
      } else {
        body.recipientId = selectedItem.conversation_id
      }

      await fetch('/api/instagram/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setReplyText('')
      setSmartReplies([])
      // Mark as replied
      setItems((prev) =>
        prev.map((i) => (i.id === selectedItem.id ? { ...i, is_replied: true } : i))
      )
    } catch (err: any) {
      setError(err.message)
    }
    setSending(false)
  }

  const filteredItems = items.filter((i) => {
    if (filter === 'comments') return i.type === 'comment'
    if (filter === 'dms') return i.type === 'dm'
    return true
  })

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return d.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Inbox size={24} className="text-primary" />
          {l.title}
        </h1>
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mx-auto">
            <InstagramIcon size={28} className="text-white" />
          </div>
          <h3 className="font-bold">{l.noConnection}</h3>
          <p className="text-sm text-muted-foreground">{l.noConnectionDesc}</p>
          <p className="text-xs text-muted-foreground">
            {language === 'de' ? 'Gehe zu Einstellungen → Instagram verbinden' : language === 'es' ? 'Ve a Ajustes → Conectar Instagram' : 'Go to Settings → Connect Instagram'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Inbox size={24} className="text-primary" />
            {l.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{l.subtitle}</p>
        </div>
        <button onClick={loadInbox} className="p-2 rounded-lg hover:bg-muted">
          <RefreshCw size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
        {(['all', 'comments', 'dms'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="lg:col-span-1 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Cargando...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Mail size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{l.noItems}</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item)
                    setSmartReplies([])
                    setReplyText('')
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    selectedItem?.id === item.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      item.type === 'comment' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {item.type === 'comment' ? <MessageCircle size={14} /> : <Mail size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{item.sender_name}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.text}</p>
                      {item.media_caption && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">📷 {item.media_caption}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <FadeIn className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {/* Message */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  selectedItem.type === 'comment' ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {selectedItem.sender_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{selectedItem.sender_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedItem.type === 'comment' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {selectedItem.type === 'comment' ? l.comments : l.dms}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{selectedItem.text}</p>
                  {selectedItem.media_caption && (
                    <p className="text-xs text-muted-foreground mt-1">📷 {selectedItem.media_caption}</p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedItem.timestamp).toLocaleString(language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US')}
                  </span>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Smart Replies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="font-bold text-sm">{l.smartReplies}</span>
                  </div>
                  <button
                    onClick={generateSmartReplies}
                    disabled={generatingReplies}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {generatingReplies ? l.generating : '✨ Generate'}
                  </button>
                </div>
                {smartReplies.length > 0 && (
                  <div className="space-y-1.5">
                    {smartReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => setReplyText(reply)}
                        className="w-full text-left p-2.5 bg-muted rounded-xl text-sm hover:bg-accent transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Replies */}
              <div className="space-y-2">
                <span className="font-bold text-sm">{l.savedReplies}</span>
                <div className="flex flex-wrap gap-1.5">
                  {savedReplies.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setReplyText(template.text)}
                      className="px-3 py-1.5 bg-muted rounded-lg text-xs hover:bg-accent transition-colors"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply input */}
              <div className="flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={l.typeReply}
                  className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || sending}
                  className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
            </FadeIn>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <MessageCircle size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === 'de' ? 'Wähle eine Nachricht' : language === 'es' ? 'Selecciona un mensaje' : 'Select a message'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}