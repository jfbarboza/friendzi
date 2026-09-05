'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown, Check } from 'lucide-react'

interface QuestionSet {
  id: string
  name: string
  description: string
  slug: string
}

export default function StartPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [friendName, setFriendName] = useState('')
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingSets, setLoadingSets] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
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

        <div className="space-y-4 border border-white/20 rounded-xl p-6 bg-white/8 backdrop-blur-sm">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Your name (optional)
            </label>
            <input
              type="text"
              placeholder="Anonymous"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 text-foreground placeholder:text-white/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
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
              className="w-full rounded-lg border border-white/20 bg-white/10 text-foreground placeholder:text-white/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
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
                {/* Mobile: custom dropdown */}
                <div className="relative md:hidden">
                  {dropdownOpen && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-white/15"
                  >
                    <span className="font-medium">
                      {questionSets.find((qs) => qs.slug === selectedSlug)?.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/60 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-20 rounded-lg border border-white/20 bg-[#0f1929] overflow-hidden shadow-xl">
                      {questionSets.map((qs) => {
                        const isSelected = selectedSlug === qs.slug
                        return (
                          <button
                            key={qs.id}
                            type="button"
                            onClick={() => { setSelectedSlug(qs.slug); setDropdownOpen(false) }}
                            className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors hover:bg-white/10 ${isSelected ? 'bg-emerald-500/10' : ''}`}
                          >
                            <div>
                              <p className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-foreground'}`}>
                                {qs.name}
                              </p>
                              {qs.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{qs.description}</p>
                              )}
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Desktop: card picker */}
                <div className="hidden md:flex md:flex-col gap-2">
                  {questionSets.map((qs) => {
                    const isSelected = selectedSlug === qs.slug
                    return (
                      <button
                        key={qs.id}
                        type="button"
                        onClick={() => setSelectedSlug(qs.slug)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                          isSelected
                            ? 'border-emerald-500/70 bg-emerald-500/10'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{qs.name}</span>
                          <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                            isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-white/30'
                          }`} />
                        </div>
                        {qs.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{qs.description}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
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
