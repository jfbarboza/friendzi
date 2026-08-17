'use client'

import { useEffect, useState } from 'react'
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
  const [friendName, setFriendName] = useState('')
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingSets, setLoadingSets] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/question-sets')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuestionSets(data)
          setSelectedSlug(data[0].slug)
        }
        setLoadingSets(false)
      })
      .catch(() => setLoadingSets(false))
  }, [])

  const handleStart = async () => {
    if (!selectedSlug) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_set_slug: selectedSlug,
          p1_name: name.trim() || 'Player 1',
          p2_name: friendName.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create session')
      }

      const data = await res.json()
      sessionStorage.setItem(`token_${data.session_id}`, data.p1_token)
      router.push(`/session/${data.p1_token}/quiz`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const selectedSet = questionSets.find((qs) => qs.slug === selectedSlug)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">FRIENDZI</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Compatibility Assessment
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
              Your friend's name (optional)
            </label>
            <input
              type="text"
              placeholder="Anonymous"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Question set
            </label>
            {loadingSets ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : questionSets.length === 0 ? (
              <p className="text-xs text-destructive">
                No question sets available.{' '}
                <a href="/admin/question-sets" className="underline">Seed one →</a>
              </p>
            ) : (
              <>
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
                {selectedSet?.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {selectedSet.description}
                  </p>
                )}
              </>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleStart}
            disabled={loading || loadingSets || !selectedSlug}
          >
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
