import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { CreateSessionResponse } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question_set_slug, p1_name } = body

  if (!question_set_slug) {
    return NextResponse.json({ error: 'question_set_slug is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Resolve question set
  const { data: qs, error: qsErr } = await supabase
    .from('question_sets')
    .select('id')
    .eq('slug', question_set_slug)
    .single()

  if (qsErr || !qs) {
    return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
  }

  // Create session
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      question_set_id: qs.id,
      p1_name: p1_name?.trim() || null,
      status: 'waiting_p2',
    })
    .select('id, p1_token, p2_token')
    .single()

  if (sessionErr || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const response: CreateSessionResponse = {
    session_id: session.id,
    p1_token: session.p1_token,
    share_url: `${baseUrl}/join/${session.id}`,
  }

  return NextResponse.json(response, { status: 201 })
}
