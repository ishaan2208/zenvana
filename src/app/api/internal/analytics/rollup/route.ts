import { NextResponse } from 'next/server'

import { rebuildDailyMetricsRollup } from '@/lib/analytics/rollup'

function isAuthorized(request: Request): boolean {
  const secret = process.env.ANALYTICS_ROLLUP_SECRET?.trim()
  if (!secret) return false
  const headerSecret = request.headers.get('x-analytics-rollup-secret')?.trim()
  if (headerSecret && headerSecret === secret) return true
  const auth = request.headers.get('authorization')?.trim()
  if (auth && auth === `Bearer ${secret}`) return true
  return false
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let daysBack = 120
  try {
    const body = (await request.json()) as { daysBack?: unknown }
    if (typeof body?.daysBack === 'number' && Number.isFinite(body.daysBack)) {
      daysBack = Math.trunc(body.daysBack)
    }
  } catch {
    /* body is optional */
  }

  try {
    await rebuildDailyMetricsRollup(daysBack)
    return NextResponse.json({ ok: true, daysBack })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rollup rebuild failed' },
      { status: 500 },
    )
  }
}
