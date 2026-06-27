'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SessionInfo {
  status: string
  p1_name: string | null
  p2_name: string | null
  question_set: { name: string; slug: string }
}

export default function JoinPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<SessionInfo | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [p2Token, setP2Token] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) {
        setError('Session not found or expired.')
        setLoading(false)
        return
      }
      const data = await res.json()
      setSession(data)
      setLoading(false)

      if (data.status === 'complete') {
        router.replace(`/report/${sessionId}`)
        return
      }

      // Fetch p2 token (needed for quiz navigation)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: s } = await supabase
        .from('sessions')
        .select('p2_token')
        .eq('id', sessionId)
        .single()
      if (s) setP2Token(s.p2_token)
    }

    fetchSession()
  }, [sessionId, router])

  const handleJoin = async () => {
    if (!p2Token) return
    setJoining(true)

    // Update p2 name if provided
    if (name.trim()) {
      await fetch(`/api/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: p2Token, player_name: name.trim(), answers: [] }),
      }).catch(() => {})
    }

    router.push(`/session/${p2Token}/quiz`)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    )
  }

  if (error || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <p className="font-semibold">Session not found</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href="/" className="text-sm underline">Start a new session</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">FRIENDZI</h1>
          <p className="text-muted-foreground text-sm">You've been invited to take the</p>
          <p className="font-semibold">{session.question_set.name}</p>
          {session.p1_name && (
            <p className="text-sm text-muted-foreground">
              {session.p1_name} is waiting for your answers
            </p>
          )}
        </div>

        <div className="border rounded-xl p-6 space-y-4">
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

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• You'll answer the same questions {session.p1_name ?? 'your friend'} already answered</p>
            <p>• For each question: your actual answer + your prediction of theirs</p>
            <p>• Neither of you sees results until both are done</p>
          </div>

          <Button className="w-full" onClick={handleJoin} disabled={joining || !p2Token}>
            {joining ? 'Loading quiz…' : 'Start Answering →'}
          </Button>
        </div>
      </div>
    </main>
  )
}
