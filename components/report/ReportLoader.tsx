'use client'

import { useEffect, useState } from 'react'
import { ReportPage } from './ReportPage'
import type { ReportData } from '@/types'
import type { NarrativeJSON } from '@/lib/engine/narrative'

interface ReportLoaderProps {
  sessionId: string
  p1Name: string
  p2Name: string
}

const MAX_ATTEMPTS = 15
const POLL_INTERVAL_MS = 3000

export function ReportLoader({ sessionId, p1Name, p2Name }: ReportLoaderProps) {
  const [report, setReport] = useState<(ReportData & { narrative_json: NarrativeJSON }) | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    let stopped = false
    let attempts = 0

    async function poll() {
      while (!stopped && attempts < MAX_ATTEMPTS) {
        attempts++
        try {
          const res = await fetch(`/api/sessions/${sessionId}/report`)
          if (res.ok) {
            const data = await res.json()
            if (data.narrative_json) {
              setReport(data)
              return
            }
          }
        } catch {
          // network hiccup — keep polling
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      }
      if (!stopped) setTimedOut(true)
    }

    poll()
    return () => { stopped = true }
  }, [sessionId])

  if (timedOut) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Taking longer than expected</h1>
          <p className="text-muted-foreground text-sm">
            Your report is still being generated. Try refreshing in a moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            Refresh
          </button>
        </div>
      </main>
    )
  }

  if (!report) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="space-y-6">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Generating your report</h1>
            <p className="text-muted-foreground text-sm">
              Analyzing {p1Name} & {p2Name}&apos;s answers…
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <ReportPage
      report={report}
      p1Name={p1Name}
      p2Name={p2Name}
      narrative={report.narrative_json}
    />
  )
}
