import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeReport } from '@/lib/scoring/algorithm'
import { generateNarrative } from '@/lib/engine/narrative'
import type { Answer, Cluster, Question } from '@/types'

interface AnswerPayload {
  question_id: string
  own_value: number
  predicted_value: number
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const body = await req.json()
  const { token, player_name, answers } = body as {
    token: string
    player_name?: string
    answers: AnswerPayload[]
  }

  if (!token || !answers?.length) {
    return NextResponse.json({ error: 'token and answers are required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Resolve player role from token
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .select('id, p1_token, p2_token, status, question_set_id')
    .eq('id', sessionId)
    .single()

  if (sessErr || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  let playerRole: 'p1' | 'p2'
  if (session.p1_token === token) {
    playerRole = 'p1'
  } else if (session.p2_token === token) {
    playerRole = 'p2'
  } else {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  // Guard: don't allow re-submission
  const { count } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('player_role', playerRole)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Answers already submitted for this player' }, { status: 409 })
  }

  // Insert answers
  const rows = answers.map((a) => ({
    session_id: sessionId,
    player_role: playerRole,
    question_id: a.question_id,
    own_value: a.own_value,
    predicted_value: a.predicted_value,
  }))

  const { error: insertErr } = await supabase.from('answers').insert(rows)
  if (insertErr) {
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
  }

  // Update player name and session status
  const nameField = playerRole === 'p1' ? 'p1_name' : 'p2_name'
  const newStatus =
    playerRole === 'p1'
      ? session.status === 'complete' ? 'complete' : 'p1_submitted'
      : 'complete'

  await supabase
    .from('sessions')
    .update({ status: newStatus, [nameField]: player_name?.trim() || null })
    .eq('id', sessionId)

  // If both players have now submitted, compute and cache the report
  if (newStatus === 'complete') {
    await generateAndCacheReport(supabase, sessionId, session.question_set_id)
  }

  return NextResponse.json({ ok: true, status: newStatus })
}

async function generateAndCacheReport(
  supabase: ReturnType<typeof createServiceClient>,
  sessionId: string,
  questionSetId: string
) {
  // Fetch questions, clusters, answers, and report_strategy in parallel
  const [{ data: questionSet }, { data: questions }, { data: clusters }, { data: allAnswers }, { data: session }] =
    await Promise.all([
      supabase
        .from('question_sets')
        .select('report_strategy')
        .eq('id', questionSetId)
        .single(),
      supabase
        .from('questions')
        .select('*')
        .eq('question_set_id', questionSetId)
        .order('order_index'),
      supabase
        .from('clusters')
        .select('*')
        .eq('question_set_id', questionSetId)
        .order('order_index'),
      supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId),
      supabase
        .from('sessions')
        .select('p1_name, p2_name')
        .eq('id', sessionId)
        .single(),
    ])

  if (!questions || !clusters || !allAnswers) return

  const p1Answers = allAnswers.filter((a) => a.player_role === 'p1') as Answer[]
  const p2Answers = allAnswers.filter((a) => a.player_role === 'p2') as Answer[]

  const report = computeReport(
    sessionId,
    questions as Question[],
    clusters as Cluster[],
    p1Answers,
    p2Answers
  )

  await supabase.from('reports').upsert({
    session_id: report.session_id,
    belief_gap: report.belief_gap,
    p1_surprise: report.p1_surprise,
    p2_surprise: report.p2_surprise,
    avg_surprise: report.avg_surprise,
    symmetry_score: report.symmetry_score,
    cluster_scores: report.cluster_scores,
    question_gaps: report.question_gaps,
    profile: report.profile,
    gpa: report.gpa,
    letter_grade: report.letter_grade,
    score: report.score,
    generated_at: report.generated_at,
  })

  // Dispatch to AI narrative engine if configured — fire-and-forget so the
  // player's submit response is not blocked by the Anthropic call latency.
  if (questionSet?.report_strategy === 'engine') {
    const p1Name = session?.p1_name ?? 'Player 1'
    const p2Name = session?.p2_name ?? 'Player 2'
    void generateNarrative(report, p1Name, p2Name).then(async (narrative) => {
      if (!narrative) return
      await supabase
        .from('reports')
        .update({ narrative_json: narrative })
        .eq('session_id', sessionId)
    })
  }
}
