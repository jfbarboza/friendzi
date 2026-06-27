import type { ReportData } from '@/types'
import { generateSurpriseNarrative } from '@/lib/scoring/narrative'
import { getP1LargestMisreads, getP2LargestMisreads } from '@/lib/scoring/algorithm'

interface SurpriseSectionProps {
  report: ReportData
  p1Name: string
  p2Name: string
}

export function SurpriseSection({ report, p1Name, p2Name }: SurpriseSectionProps) {
  const { p1Summary, p2Summary } = generateSurpriseNarrative(report, p1Name, p2Name)
  const p1Misreads = getP1LargestMisreads(report, 4)
  const p2Misreads = getP2LargestMisreads(report, 4)

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2">
        <div className="border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {p1Name} predicts {p2Name} — {report.p1_surprise.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{p1Summary}</p>
        </div>
        <div className="border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {p2Name} predicts {p1Name} — {report.p2_surprise.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{p2Summary}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2">
        <MisreadTable title={`${p1Name}'s Largest Misreads`} misreads={p1Misreads} p1Name={p1Name} p2Name={p2Name} role="p1" />
        <MisreadTable title={`${p2Name}'s Largest Misreads`} misreads={p2Misreads} p1Name={p1Name} p2Name={p2Name} role="p2" />
      </div>
    </div>
  )
}

function MisreadTable({
  title,
  misreads,
  p1Name,
  p2Name,
  role,
}: {
  title: string
  misreads: ReturnType<typeof getP1LargestMisreads>
  p1Name: string
  p2Name: string
  role: 'p1' | 'p2'
}) {
  if (misreads.length === 0) return null
  const actualLabel = role === 'p1' ? p2Name : p1Name
  const predictedLabel = role === 'p1' ? p1Name : p2Name

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="pb-1 text-left text-muted-foreground font-medium">Question</th>
            <th className="pb-1 text-right text-muted-foreground font-medium pr-2">Actual</th>
            <th className="pb-1 text-right text-muted-foreground font-medium pr-2">Predicted</th>
            <th className="pb-1 text-right text-muted-foreground font-medium">Gap</th>
          </tr>
        </thead>
        <tbody>
          {misreads.map((m) => {
            const actual = role === 'p1' ? m.p2_own : m.p1_own
            const predicted = role === 'p1' ? m.p1_predicted_p2 : m.p2_predicted_p1
            const gap = role === 'p1' ? m.p1_surprise : m.p2_surprise
            return (
              <tr key={m.question_id} className="border-b last:border-0">
                <td className="py-1.5 pr-2 leading-tight">{m.question_text.slice(0, 50)}…</td>
                <td className="py-1.5 pr-2 text-right font-semibold">{actual}</td>
                <td className="py-1.5 pr-2 text-right font-semibold">{predicted}</td>
                <td className="py-1.5 text-right text-red-500 font-semibold">{gap.toFixed(0)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
