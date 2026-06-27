import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: qs }, { data: clusters }, { data: questions }] = await Promise.all([
    supabase.from('question_sets').select('*').eq('id', id).single(),
    supabase.from('clusters').select('*').eq('question_set_id', id).order('order_index'),
    supabase.from('questions').select('*').eq('question_set_id', id).order('order_index'),
  ])

  if (!qs) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...qs, clusters, questions })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token =
    req.headers.get('x-admin-token') ?? req.nextUrl.searchParams.get('token')
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase.from('question_sets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
