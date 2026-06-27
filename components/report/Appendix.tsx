import type { ReportData } from '@/types'
import { getAllQuestionsSorted } from '@/lib/scoring/algorithm'
import { gapToColor } from '@/lib/scoring/grades'

interface AppendixProps {
  report: ReportData
  p1Name: string
  p2Name: string
}

export function Appendix({ report, p1Name, p2Name }: AppendixProps) {
  const sorted = getAllQuestionsSorted(report)

  const colorMap = {
    red: 'text-red-500',
    amber: 'text-amber-500',
    gray: 'text-muted-foreground',
    green: 'text-emerald-500',
  }

  const faultCount = sorted.filter((q) => q.belief_gap >= 4).length
  const frictionCount = sorted.filter((q) => q.belief_gap >= 2 && q.belief_gap < 4).length
  const minorCount = sorted.filter((q) => q.belief_gap === 1).length
  const solidCount = sorted.filter((q) => q.belief_gap === 0).length

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {sorted.length} questions · {solidCount} at gap 0 · {minorCount} at gap 1 · {frictionCount} at gap 2–3 · {faultCount} at gap 4+ (fault lines)
      </p>

      <div className="flex gap-6 text-xs">
        <span className="text-red-500 font-semibold">● Gap ≥ 4 — Fault line</span>
        <span className="text-amber-500 font-semibold">● Gap 2–3 — Friction zone</span>
        <span className="text-muted-foreground font-semibold">● Gap 1 — Minor friction</span>
        <span className="text-emerald-500 font-semibold">● Gap 0 — Solid ground</span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-semibold uppercase tracking-widest text-muted-foreground w-8">#</th>
            <th className="pb-2 font-semibold uppercase tracking-widest text-muted-foreground">{p1Name}</th>
            <th className="pb-2 font-semibold uppercase tracking-widest text-muted-foreground">{p2Name}</th>
            <th className="pb-2 font-semibold uppercase tracking-widest text-muted-foreground">Gap</th>
            <th className="pb-2 font-semibold uppercase tracking-widest text-muted-foreground">Question</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((q, i) => {
            const color = gapToColor(q.belief_gap)
            return (
              <tr key={q.question_id} className="border-b last:border-0">
                <td className="py-1.5 pr-2 text-muted-foreground">{i + 1}</td>
                <td className={`py-1.5 pr-3 font-semibold ${colorMap[color]}`}>{q.p1_own}</td>
                <td className={`py-1.5 pr-3 font-semibold ${colorMap[color]}`}>{q.p2_own}</td>
                <td className={`py-1.5 pr-3 font-semibold ${colorMap[color]}`}>
                  {q.belief_gap.toFixed(0)}
                </td>
                <td className="py-1.5 leading-tight">{q.question_text}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
