'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Ocurrió un error inesperado. Intenta de nuevo o recarga la página.
      </p>
      {error.message && (
        <p className="text-xs text-muted-foreground mb-4 bg-muted px-3 py-1.5 rounded-lg font-mono">
          {error.message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCw size={16} />
          Intentar de nuevo
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
          Recargar página
        </Button>
      </div>
    </div>
  )
}