import type { ReportData } from '@/types'
import { beliefGapBandLabel, surpriseBandLabel, symmetryLabel } from '@/lib/scoring/narrative'

interface SummaryNumbersProps {
  report: ReportData
}

export function SummaryNumbers({ report }: SummaryNumbersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
      <Metric
        label="Belief Gap"
        value={report.belief_gap.toFixed(2)}
        sublabel={beliefGapBandLabel(report.belief_gap)}
        color="green"
      />
      <Metric
        label="Avg Surprise Factor"
        value={report.avg_surprise.toFixed(2)}
        sublabel={surpriseBandLabel(report.avg_surprise)}
        color="amber"
      />
      <Metric
        label="Symmetry Score"
        value={report.symmetry_score.toFixed(2)}
        sublabel={symmetryLabel(report.symmetry_score)}
        color="blue"
      />
    </div>
  )
}

function Metric({
  label,
  value,
  sublabel,
  color,
}: {
  label: string
  value: string
  sublabel: string
  color: 'green' | 'amber' | 'blue'
}) {
  const colorMap = {
    green: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`text-5xl font-bold tabular-nums ${colorMap[color]}`}>{value}</p>
      <p className="text-sm text-muted-foreground leading-snug">{sublabel}</p>
    </div>
  )
}
