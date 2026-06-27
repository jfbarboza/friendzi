'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function WaitingPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [shareUrl, setShareUrl] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [partnerName, setPartnerName] = useState('your friend')

  useEffect(() => {
    // Resolve the session from the token
    const resolveSession = async () => {
      const supabase = createClient()

      const { data: s1 } = await supabase
        .from('sessions')
        .select('id, p1_token, p2_token, p1_name, p2_name, status')
        .eq('p1_token', token)
        .single()

      const session = s1 ?? await (async () => {
        const { data } = await supabase
          .from('sessions')
          .select('id, p1_token, p2_token, p1_name, p2_name, status')
          .eq('p2_token', token)
          .single()
        return data
      })()

      if (!session) return

      // If already complete, go directly to report
      if (session.status === 'complete') {
        router.replace(`/report/${session.id}`)
        return
      }

      setSessionId(session.id)
      const isP1 = session.p1_token === token
      setPartnerName(isP1 ? (session.p2_name ?? 'your friend') : (session.p1_name ?? 'your friend'))

      const base = window.location.origin
      setShareUrl(`${base}/join/${session.id}`)

      // Subscribe to realtime changes on this session
      const channel = supabase
        .channel(`session-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessions',
            filter: `id=eq.${session.id}`,
          },
          (payload) => {
            if (payload.new.status === 'complete') {
              router.replace(`/report/${session.id}`)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    resolveSession()
  }, [token, router])

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <div className="text-4xl animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold">Waiting for {partnerName}</h1>
          <p className="text-muted-foreground text-sm">
            Your answers are locked. Share the link below so {partnerName} can answer. The report
            will unlock automatically when both of you are done.
          </p>
        </div>

        {shareUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border rounded-lg p-3">
              <span className="text-xs text-muted-foreground flex-1 text-left truncate">
                {shareUrl}
              </span>
              <button
                onClick={copyLink}
                className="text-xs font-semibold shrink-0 px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send this link to {partnerName}. They don't need an account.
            </p>
          </div>
        )}

        <div className="border rounded-xl p-5 text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">What happens next</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Your answers are saved</li>
            <li>○ Waiting for {partnerName} to complete their answers</li>
            <li>○ Report unlocks automatically for both of you</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
