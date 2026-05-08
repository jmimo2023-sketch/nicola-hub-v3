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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=invalid_credentials')
  }

  if (!data.user) {
    redirect('/login?error=invalid_credentials')
  }

  // redirect() is fine here — Supabase sets cookies via setAll()
  // which Next.js picks up before throwing the redirect response
  redirect('/es/home')
}

export async function handleSignUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
    },
  })

  if (error) {
    redirect('/login?mode=signup&error=' + encodeURIComponent(error.message))
  }

  // If email confirmation is required, redirect to login with message
  if (data.user && !data.session) {
    redirect('/login?message=account_created')
  }

  // Auto-confirmed — redirect to home
  redirect('/es/home')
}