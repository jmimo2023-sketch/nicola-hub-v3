import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Mail } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/es/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">Nicola Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Content Intelligence Platform</p>
        </div>

        {/* Error/Success Messages */}
        {params.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500 text-center">
            {params.error === 'invalid_credentials' && 'Email o contraseña incorrectos'}
            {params.error === 'auth_callback_failed' && 'Error en la autenticación. Intenta de nuevo.'}
            {!['invalid_credentials', 'auth_callback_failed'].includes(params.error) && params.error}
          </div>
        )}
        {params.message && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-500 text-center">
            {params.message === 'check_email' && '¡Revisa tu email! Te enviamos un enlace mágico.'}
            {params.message === 'logged_out' && 'Sesión cerrada correctamente.'}
          </div>
        )}

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          {/* Magic Link (Email Link) */}
          <form action={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email-magic" className="text-sm font-medium block mb-1.5">Email</label>
              <input
                id="email-magic"
                name="email"
                type="email"
                required
                placeholder="nicola@example.com"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Enviar enlace mágico
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">o usa contraseña</span>
            </div>
          </div>

          {/* Email + Password */}
          <form action={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email-pass" className="text-sm font-medium block mb-1.5">Email</label>
              <input
                id="email-pass"
                name="email"
                type="email"
                required
                placeholder="nicola@example.com"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium block mb-1.5">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-muted text-foreground border border-border py-2.5 rounded-xl font-bold text-sm hover:bg-accent transition-colors"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}

async function handleMagicLink(formData: FormData) {
  'use server'
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/login?message=check_email')
}

async function handleLogin(formData: FormData) {
  'use server'
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=invalid_credentials')
  }

  redirect('/es/home')
}