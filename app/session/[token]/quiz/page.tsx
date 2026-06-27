import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { QuizShell } from '@/components/quiz/QuizShell'
import type { Question } from '@/types'

interface Props {
  params: Promise<{ token: string }>
}

export default async function QuizPage({ params }: Props) {
  const { token } = await params
  const supabase = createServiceClient()

  // Resolve session from token (works for both p1 and p2)
  const { data: sessionP1 } = await supabase
    .from('sessions')
    .select('id, p1_token, p2_token, p1_name, p2_name, status, question_set_id')
    .eq('p1_token', token)
    .single()

  const { data: sessionP2 } = !sessionP1
    ? await supabase
        .from('sessions')
        .select('id, p1_token, p2_token, p1_name, p2_name, status, question_set_id')
        .eq('p2_token', token)
        .single()
    : { data: null }

  const session = sessionP1 ?? sessionP2
  if (!session) notFound()

  const playerRole = session.p1_token === token ? 'p1' : 'p2'
  const playerName = playerRole === 'p1' ? (session.p1_name ?? 'You') : (session.p2_name ?? 'You')
  const partnerName = playerRole === 'p1' ? (session.p2_name ?? 'Your friend') : (session.p1_name ?? 'Your friend')

  // Check if this player already submitted
  const { count } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .eq('player_role', playerRole)

  if ((count ?? 0) > 0) {
    // Already answered — redirect to waiting or report
    const { redirect } = await import('next/navigation')
    if (session.status === 'complete') {
      redirect(`/report/${session.id}`)
    } else {
      redirect(`/session/${token}/waiting`)
    }
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('question_set_id', session.question_set_id)
    .order('order_index')

  if (!questions?.length) notFound()

  return (
    <QuizShell
      sessionId={session.id}
      token={token}
      questions={questions as Question[]}
      playerName={playerName}
      partnerName={partnerName}
    />
  )
}
