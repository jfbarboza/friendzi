import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ReportPage } from '@/components/report/ReportPage'
import { ReportLoader } from '@/components/report/ReportLoader'
import type { ReportData } from '@/types'
import type { NarrativeJSON } from '@/lib/engine/narrative'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function ReportPageRoute({ params }: Props) {
  const { sessionId } = await params
  const supabase = createServiceClient()

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error || !report) {
    // Check if session exists but isn't complete yet
    const { data: session } = await supabase
      .from('sessions')
      .select('status, p1_name, p2_name')
      .eq('id', sessionId)
      .single()

    if (!session) notFound()

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Report Not Ready Yet</h1>
          <p className="text-muted-foreground text-sm">
            Both players need to complete their answers before the report is generated.
          </p>
          <p className="text-xs text-muted-foreground">
            Current status: <strong>{session.status}</strong>
          </p>
          <a href="/" className="text-sm underline">Go home</a>
        </div>
      </main>
    )
  }

  const { data: session } = await supabase
    .from('sessions')
    .select('p1_name, p2_name, question_set_id')
    .eq('id', sessionId)
    .single()

  const p1Name = session?.p1_name ?? 'Player 1'
  const p2Name = session?.p2_name ?? 'Player 2'
  const narrative = (report.narrative_json ?? null) as NarrativeJSON | null

  let isEngineSession = false
  if (session?.question_set_id) {
    const { data: qs } = await supabase
      .from('question_sets')
      .select('report_strategy')
      .eq('id', session.question_set_id)
      .single()
    isEngineSession = qs?.report_strategy === 'engine'
  }

  if (isEngineSession && !narrative) {
    return <ReportLoader sessionId={sessionId} p1Name={p1Name} p2Name={p2Name} />
  }

  return <ReportPage report={report as ReportData} p1Name={p1Name} p2Name={p2Name} narrative={narrative} />
}
