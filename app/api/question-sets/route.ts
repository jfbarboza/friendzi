import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isAdmin(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ??
    req.nextUrl.searchParams.get('token')
  return token === process.env.ADMIN_TOKEN
}

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('question_sets')
    .select('id, name, description, slug, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, slug, clusters, questions } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: qs, error: qsErr } = await supabase
    .from('question_sets')
    .insert({ name, description: description ?? '', slug })
    .select('id')
    .single()

  if (qsErr || !qs) {
    return NextResponse.json({ error: qsErr?.message ?? 'Failed to create set' }, { status: 500 })
  }

  // Insert clusters
  const clusterRows = (clusters ?? []).map((c: { name: string; order_index: number }, i: number) => ({
    question_set_id: qs.id,
    name: c.name,
    order_index: c.order_index ?? i,
  }))

  let clusterIds: string[] = []
  if (clusterRows.length > 0) {
    const { data: insertedClusters, error: cErr } = await supabase
      .from('clusters')
      .insert(clusterRows)
      .select('id, order_index')
      .order('order_index')

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    clusterIds = (insertedClusters ?? []).map((c: { id: string }) => c.id)
  }

  // Insert questions
  if (questions?.length && clusterIds.length > 0) {
    const questionRows = questions.map(
      (q: {
        cluster_index: number
        order_index: number
        text: string
        type: string
        options?: unknown
        narrative_tags?: string[]
      }) => ({
        question_set_id: qs.id,
        cluster_id: clusterIds[q.cluster_index],
        text: q.text,
        type: q.type,
        options: q.options ?? null,
        narrative_tags: q.narrative_tags ?? null,
        order_index: q.order_index,
      })
    )

    const { error: qErr } = await supabase.from('questions').insert(questionRows)
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: qs.id }, { status: 201 })
}
