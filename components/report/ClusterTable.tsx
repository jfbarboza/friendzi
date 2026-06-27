import type { ClusterScore } from '@/types'
import { gapToColor } from '@/lib/scoring/grades'

interface ClusterTableProps {
  clusters: ClusterScore[]
  gpa: number
  letterGrade: string
  score: number
}

export function ClusterTable({ clusters, gpa, letterGrade, score }: ClusterTableProps) {
  return (
    <div className="space-y-6">
      {/* GPA summary */}
      <div className="flex items-center gap-8 py-4 border-b">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Relationship GPA</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{gpa.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">out of 4.0</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Letter Grade</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{letterGrade}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Score</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{score}</p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
      </div>

      {/* Per-cluster table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground">Cluster</th>
            <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground text-right">Avg Gap</th>
            <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground text-right">Match %</th>
            <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground text-right">Grade</th>
          </tr>
        </thead>
        <tbody>
          {clusters.map((c, i) => (
            <tr key={c.cluster_id ?? i} className="border-b last:border-0">
              <td className="py-3 pr-4">{c.cluster_name}</td>
              <td className="py-3 text-right">
                <GapBadge gap={c.avg_gap} />
              </td>
              <td className="py-3 text-right text-muted-foreground">{c.match_percent}%</td>
              <td className="py-3 text-right font-semibold">
                <GradeBadge grade={c.grade} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GapBadge({ gap }: { gap: number }) {
  const color = gapToColor(gap)
  const map = {
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    gray: 'text-muted-foreground',
    green: 'text-emerald-600 dark:text-emerald-400',
  }
  return <span className={`font-semibold tabular-nums ${map[color]}`}>{gap.toFixed(2)}</span>
}

function GradeBadge({ grade }: { grade: string }) {
  const gradeColor: Record<string, string> = {
    A: 'text-emerald-600 dark:text-emerald-400',
    'B+': 'text-emerald-500',
    B: 'text-emerald-500',
    C: 'text-amber-600 dark:text-amber-400',
    D: 'text-red-500',
    F: 'text-red-700',
  }
  return <span className={gradeColor[grade] ?? ''}>{grade}</span>
}
