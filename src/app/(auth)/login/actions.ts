'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function handleMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nicola-hub-v3.vercel.app'}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/login?message=check_email')
}

export async function handleLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=invalid_credentials')
  }

  redirect('/es/home')
}

export async function handleSignUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
    },
  })

  if (error) {
    redirect('/login?mode=signup&error=' + encodeURIComponent(error.message))
  }

  // Auto-confirm for development — in production, user would need to confirm email
  // Try to sign in immediately
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    redirect('/login?message=account_created')
  }

  redirect('/es/home')
}