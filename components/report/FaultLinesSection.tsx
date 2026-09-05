import type { QuestionGap } from '@/types'
import { gapToColor } from '@/lib/scoring/grades'
import { getFaultLines, getFrictionZones } from '@/lib/scoring/algorithm'
import type { ReportData } from '@/types'
import type { NarrativeJSON } from '@/lib/engine/narrative'

interface FaultLinesSectionProps {
  report: ReportData
  p1Name: string
  p2Name: string
  narrativeFaultLines?: NarrativeJSON['fault_lines'] | null
}

export function FaultLinesSection({ report, p1Name, p2Name, narrativeFaultLines }: FaultLinesSectionProps) {
  const faultLines = getFaultLines(report)
  const frictionZones = getFrictionZones(report)

  return (
    <div className="space-y-8">
      {faultLines.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-400 mb-4">
            Fault Lines — Gap ≥ 4
          </h3>
          <div className="space-y-3">
            {faultLines.map((g) => (
              <GapRow
                key={g.question_id}
                gap={g}
                p1Name={p1Name}
                p2Name={p2Name}
                narrativeText={narrativeFaultLines?.find(n => n.question_text === g.question_text)?.text}
              />
            ))}
          </div>
        </div>
      )}

      {frictionZones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4">
            Friction Zones — Gap 2–3
          </h3>
          <div className="space-y-3">
            {frictionZones.map((g) => (
              <GapRow
                key={g.question_id}
                gap={g}
                p1Name={p1Name}
                p2Name={p2Name}
                narrativeText={narrativeFaultLines?.find(n => n.question_text === g.question_text)?.text}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function GapRow({
  gap,
  p1Name,
  p2Name,
  narrativeText,
}: {
  gap: QuestionGap
  p1Name: string
  p2Name: string
  narrativeText?: string
}) {
  const color = gapToColor(gap.belief_gap)
  const borderMap = {
    red: 'border-l-red-500',
    amber: 'border-l-amber-500',
    gray: 'border-l-border',
    green: 'border-l-emerald-500',
  }

  return (
    <div className={`border-l-4 pl-4 py-2 ${borderMap[color]}`}>
      <p className="text-sm font-medium leading-snug">{gap.question_text}</p>
      <div className="flex gap-6 mt-1 text-xs text-muted-foreground">
        <span>
          {p1Name}: <strong>{gap.p1_own}</strong>
        </span>
        <span>
          {p2Name}: <strong>{gap.p2_own}</strong>
        </span>
        <span className="font-semibold">Gap: {gap.belief_gap.toFixed(1)}</span>
      </div>
      {narrativeText && (
        <p className="mt-2 text-xs text-foreground/75 italic leading-relaxed">{narrativeText}</p>
      )}
    </div>
  )
}
