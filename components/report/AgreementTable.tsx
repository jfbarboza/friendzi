import React from 'react'
import type { ReportData } from '@/types'
import { getAgreements } from '@/lib/scoring/algorithm'
import type { NarrativeJSON } from '@/lib/engine/narrative'

interface AgreementTableProps {
  report: ReportData
  p1Name: string
  p2Name: string
  narrativeStrengths?: NarrativeJSON['strengths'] | null
}

export function AgreementTable({ report, p1Name, p2Name, narrativeStrengths }: AgreementTableProps) {
  const agreements = getAgreements(report)

  if (agreements.length === 0) return null

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground">Question</th>
          <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground text-right pr-3">{p1Name}</th>
          <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground text-right pr-3">{p2Name}</th>
          <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground text-right">Gap</th>
        </tr>
      </thead>
      <tbody>
        {agreements.map((g) => {
          const insight = narrativeStrengths?.find(n => n.question_text === g.question_text)
          return (
            <React.Fragment key={g.question_id}>
              <tr className="border-b last:border-0">
                <td className="py-2 pr-4 text-xs leading-snug">{g.question_text}</td>
                <td className="py-2 pr-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {g.p1_own}
                </td>
                <td className="py-2 pr-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {g.p2_own}
                </td>
                <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                  {g.belief_gap.toFixed(0)}
                </td>
              </tr>
              {insight && (
                <tr className="border-b last:border-0">
                  <td colSpan={4} className="px-2 pb-3 text-xs text-foreground/75 italic leading-relaxed">
                    {insight.text}
                  </td>
                </tr>
              )}
            </React.Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
