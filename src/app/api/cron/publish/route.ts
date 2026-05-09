import { NextRequest, NextResponse } from 'next/server'
import { processPublishingQueue } from '@/lib/instagram/publishing-engine'

// GET /api/cron/publish — Called by Vercel Cron every 5 minutes
// Processes the publishing queue and publishes scheduled content

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = request.headers.get('authorization')
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processPublishingQueue()

    console.log(`[Cron/Publish] Processed: ${result.processed}, Failed: ${result.failed}`)

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Cron/Publish] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}