'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface QuestionSet {
  id: string
  name: string
  description: string
  slug: string
  created_at: string
}

export default function AdminQuestionSetsPage() {
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState<string | null>(null)
  const [adminToken, setAdminToken] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const fetchSets = async () => {
    const res = await fetch('/api/question-sets')
    const data = await res.json()
    setSets(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchSets() }, [])

  const seedSet = async (slug: string) => {
    if (!adminToken) return alert('Enter admin token first')
    setSeeding(slug)
    setMessage(null)
    const res = await fetch(`/api/admin/seed?token=${adminToken}&slug=${slug}`, { method: 'POST' })
    const data = await res.json()
    setMessage(data.message ?? data.error)
    await fetchSets()
    setSeeding(null)
  }

  const deleteSet = async (id: string) => {
    if (!adminToken) return alert('Enter admin token first')
    if (!confirm('Delete this question set? This cannot be undone.')) return
    await fetch(`/api/question-sets/${id}?token=${adminToken}`, { method: 'DELETE' })
    await fetchSets()
  }

  const SEEDS = [
    {
      slug: 'breaking-the-ice',
      label: 'Seed Breaking the Ice',
      detail: '25 icebreaker questions across personality, social style, and habits.',
    },
    {
      slug: 'deep-exploration',
      label: 'Seed Deep Exploration',
      detail: '50 rigorous questions across epistemology, conflict, justice, civilization, identity, and politics.',
    },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Question Sets</h1>
        <a href="/" className="text-sm text-muted-foreground underline">← Home</a>
      </div>

      <div className="border rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin Token</p>
        <input
          type="password"
          placeholder="Enter ADMIN_TOKEN"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
        />
      </div>

      <div className="border rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Seed Question Sets</p>
        <p className="text-sm text-muted-foreground">
          All seeds are idempotent — safe to run multiple times.
        </p>
        <div className="space-y-3">
          {SEEDS.map((s) => (
            <div key={s.slug} className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
              </div>
              <Button
                onClick={() => seedSet(s.slug)}
                disabled={seeding !== null}
                variant="outline"
                className="shrink-0"
              >
                {seeding === s.slug ? 'Seeding…' : 'Seed'}
              </Button>
            </div>
          ))}
        </div>
        {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Active Question Sets ({sets.length})
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No question sets yet. Seed one above to get started.</p>
        ) : (
          <div className="space-y-2">
            {sets.map((s) => (
              <div key={s.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">/{s.slug}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
                <button
                  onClick={() => deleteSet(s.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
