import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateAdvisorReport } from '@/lib/ai/advisor-engine'

// GET /api/insights/recommendations — Get AI-powered recommendations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await generateAdvisorReport(user.id)
    return NextResponse.json(report)
  } catch (error: any) {
    console.error('[Advisor] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}