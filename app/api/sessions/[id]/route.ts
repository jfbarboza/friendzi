import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      id, status, p1_name, p2_name, p1_token, p2_token,
      question_sets ( name, slug )
    `)
    .eq('id', id)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: session.status,
    p1_name: session.p1_name,
    p2_name: session.p2_name,
    question_set: session.question_sets,
  })
}
