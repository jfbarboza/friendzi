import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const supabase = createServiceClient()

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error || !report) {
    return NextResponse.json({ error: 'Report not ready' }, { status: 404 })
  }

  // Fetch player names from session
  const { data: session } = await supabase
    .from('sessions')
    .select('p1_name, p2_name')
    .eq('id', sessionId)
    .single()

  return NextResponse.json({
    ...report,
    p1_name: session?.p1_name,
    p2_name: session?.p2_name,
    narrative_json: report.narrative_json ?? null,
  })
}
