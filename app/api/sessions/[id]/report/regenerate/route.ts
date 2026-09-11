import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateNarrative } from '@/lib/engine/narrative'
import type { ReportData } from '@/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const supabase = createServiceClient()

  const [{ data: report }, { data: session }] = await Promise.all([
    supabase.from('reports').select('*').eq('session_id', sessionId).single(),
    supabase.from('sessions').select('p1_name, p2_name, question_set_id').eq('id', sessionId).single(),
  ])

  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  // Narrative already exists — return immediately
  if (report.narrative_json) {
    return NextResponse.json({
      ...report,
      p1_name: session?.p1_name,
      p2_name: session?.p2_name,
    })
  }

  // Only engine sessions get a narrative
  const { data: qs } = await supabase
    .from('question_sets')
    .select('report_strategy')
    .eq('id', session?.question_set_id)
    .single()

  if (qs?.report_strategy !== 'engine') {
    return NextResponse.json({
      ...report,
      p1_name: session?.p1_name,
      p2_name: session?.p2_name,
    })
  }

  const p1Name = session?.p1_name ?? 'Player 1'
  const p2Name = session?.p2_name ?? 'Player 2'
  const narrative = await generateNarrative(report as ReportData, p1Name, p2Name)

  if (narrative) {
    await supabase
      .from('reports')
      .update({ narrative_json: narrative })
      .eq('session_id', sessionId)
  }

  return NextResponse.json({
    ...report,
    narrative_json: narrative ?? null,
    p1_name: session?.p1_name,
    p2_name: session?.p2_name,
  })
}
