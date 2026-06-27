'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface QuestionSet {
  id: string
  name: string
  description: string
  slug: string
}

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('yyosd')
  const [loading, setLoading] = useState(false)
  const [loadingSets, setLoadingSets] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchSets = async () => {
    setLoadingSets(true)
    const res = await fetch('/api/question-sets')
    const data = await res.json()
    setQuestionSets(data)
    if (data.length > 0) setSelectedSlug(data[0].slug)
    setLoadingSets(false)
    setFetched(true)
  }

  const handleStart = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_set_slug: selectedSlug,
          p1_name: name.trim() || 'Player 1',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create session')
      }

      const data = await res.json()
      // Store token in sessionStorage so the quiz page can use it
      sessionStorage.setItem(`token_${data.session_id}`, data.p1_token)
      router.push(`/session/${data.p1_token}/quiz`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">FRIENDZI</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Yin Yang Operating System Diagnostic
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You and a friend each answer the same questions independently — what you believe, and
            what you predict each other will answer. Neither sees results until both are done.
          </p>
        </div>

        <div className="space-y-4 border rounded-xl p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Your name (optional)
            </label>
            <input
              type="text"
              placeholder="Anonymous"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Question set
            </label>
            {!fetched ? (
              <button
                onClick={fetchSets}
                className="text-xs text-muted-foreground underline"
                disabled={loadingSets}
              >
                {loadingSets ? 'Loading…' : 'Load available sets'}
              </button>
            ) : (
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
              >
                {questionSets.map((qs) => (
                  <option key={qs.id} value={qs.slug}>
                    {qs.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleStart} disabled={loading}>
            {loading ? 'Creating session…' : 'Start →'}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          No account required · Your answers are private until both players submit
        </p>
      </div>
    </main>
  )
}
