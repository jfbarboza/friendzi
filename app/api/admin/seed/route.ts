import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { YYOSD_SEED } from '@/lib/seeds/yyosd'
import { BTI_SEED } from '@/lib/seeds/breaking-the-ice'

const SEEDS = {
  'deep-exploration': YYOSD_SEED,
  'breaking-the-ice': BTI_SEED,
} as const

type SeedSlug = keyof typeof SEEDS

export async function POST(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ?? req.nextUrl.searchParams.get('token')
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = (req.nextUrl.searchParams.get('slug') ?? 'deep-exploration') as SeedSlug
  const seed = SEEDS[slug]
  if (!seed) {
    return NextResponse.json({ error: `Unknown seed slug: ${slug}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Idempotent — skip if already exists
  const { data: existing } = await supabase
    .from('question_sets')
    .select('id')
    .eq('slug', seed.slug)
    .single()

  if (existing) {
    return NextResponse.json({ message: `"${seed.name}" already seeded`, id: existing.id })
  }

  // Insert question set
  const { data: qs, error: qsErr } = await supabase
    .from('question_sets')
    .insert({
      name: seed.name,
      description: seed.description,
      slug: seed.slug,
    })
    .select('id')
    .single()

  if (qsErr || !qs) {
    return NextResponse.json({ error: qsErr?.message }, { status: 500 })
  }

  // Insert clusters
  const { data: insertedClusters, error: cErr } = await supabase
    .from('clusters')
    .insert(
      seed.clusters.map((c) => ({
        question_set_id: qs.id,
        name: c.name,
        order_index: c.order_index,
      }))
    )
    .select('id, order_index')
    .order('order_index')

  if (cErr || !insertedClusters) {
    return NextResponse.json({ error: cErr?.message }, { status: 500 })
  }

  const clusterIds = insertedClusters.map((c: { id: string }) => c.id)

  // Insert questions
  const questionRows = seed.questions.map((q) => ({
    question_set_id: qs.id,
    cluster_id: clusterIds[q.cluster_index],
    text: q.text,
    type: q.type,
    options: q.options ?? null,
    narrative_tags: q.narrative_tags ?? null,
    order_index: q.order_index,
  }))

  const { error: questErr } = await supabase.from('questions').insert(questionRows)
  if (questErr) {
    return NextResponse.json({ error: questErr.message }, { status: 500 })
  }

  return NextResponse.json(
    { message: `"${seed.name}" seeded successfully (${seed.questions.length} questions)`, id: qs.id },
    { status: 201 }
  )
}
