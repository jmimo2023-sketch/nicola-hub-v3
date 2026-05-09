'use client'

import { useState, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Calendar, Clock, Sparkles, Zap, Check } from 'lucide-react'

interface ScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentTitle: string
  onSchedule: (date: string, time: string, timezone: string) => Promise<void>
}

// Best time suggestions
function getBestTimes() {
  return [
    { hour: 7, label: '7:00 AM', score: 72, reason: 'Buen engagement matutino' },
    { hour: 9, label: '9:00 AM', score: 78, reason: 'Pico de actividad matutina' },
    { hour: 12, label: '12:00 PM', score: 85, reason: 'Almuerzo — alto engagement' },
    { hour: 18, label: '6:00 PM', score: 92, reason: '🔥 Mejor hora — después del trabajo' },
    { hour: 19, label: '7:00 PM', score: 88, reason: 'Prime time vespertino' },
    { hour: 21, label: '9:00 PM', score: 75, reason: 'Última revisada del día' },
  ].sort((a, b) => b.score - a.score)
}

export function ScheduleModal({ open, onOpenChange, contentTitle, onSchedule }: ScheduleModalProps) {
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1) // default: tomorrow
    return d.toISOString().split('T')[0]
  })
  const [time, setTime] = useState('18:00')
  const [timezone, setTimezone] = useState('America/Bogota')
  const [scheduling, setScheduling] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const bestTimes = useMemo(() => getBestTimes(), [])

  const handleSchedule = async () => {
    setScheduling(true)
    try {
      await onSchedule(date, time, timezone)
      onOpenChange(false)
    } finally {
      setScheduling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Programar Publicación
          </DialogTitle>
          <DialogDescription className="text-sm">
            {contentTitle || 'Selecciona fecha y hora'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date Picker */}
          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
              <Calendar size={14} /> Fecha
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
              <Clock size={14} /> Hora
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Best Time Suggestions */}
          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" /> Mejores Horarios
            </label>
            <div className="space-y-1.5">
              {bestTimes.map((slot) => (
                <button
                  key={slot.hour}
                  onClick={() => {
                    setTime(`${slot.hour.toString().padStart(2, '0')}:00`)
                    setSelectedTime(slot.label)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all',
                    selectedTime === slot.label
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/30'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    slot.score >= 85 ? 'bg-green-100 text-green-700' :
                    slot.score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {slot.score}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{slot.label}</div>
                    <div className="text-xs text-muted-foreground">{slot.reason}</div>
                  </div>
                  {selectedTime === slot.label && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Zona horaria</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-sm border border-border rounded-lg p-2 bg-background"
            >
              <option value="America/Bogota">Colombia (UTC-5)</option>
              <option value="America/Cancun">México Centro (UTC-6)</option>
              <option value="America/Mexico_City">México (UTC-6)</option>
              <option value="Europe/Madrid">España (UTC+1)</option>
              <option value="Europe/Berlin">Alemania (UTC+1)</option>
              <option value="US/Eastern">US Eastern (UTC-5)</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={scheduling}>
            Cancelar
          </Button>
          <Button onClick={handleSchedule} disabled={scheduling} className="gap-1.5">
            {scheduling ? (
              <>Programando...</>
            ) : (
              <>
                <Zap size={14} /> Programar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}