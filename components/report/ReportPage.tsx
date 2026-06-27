'use client'

import type { ReportData } from '@/types'
import { PROFILE_LABELS } from '@/lib/scoring/grades'
import { generateBottomLine } from '@/lib/scoring/narrative'
import { SummaryNumbers } from './SummaryNumbers'
import { ClusterTable } from './ClusterTable'
import { FaultLinesSection } from './FaultLinesSection'
import { AgreementTable } from './AgreementTable'
import { OSTopology } from './OSTopology'
import { SurpriseSection } from './SurpriseSection'
import { InvestmentTable } from './InvestmentTable'
import { Appendix } from './Appendix'
import { Separator } from '@/components/ui/separator'

interface ReportPageProps {
  report: ReportData
  p1Name: string
  p2Name: string
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6 print:break-inside-avoid-page">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </p>
        <Separator />
      </div>
      {children}
    </section>
  )
}

export function ReportPage({ report, p1Name, p2Name }: ReportPageProps) {
  const profile = PROFILE_LABELS[report.profile]
  const { headline, paragraphs } = generateBottomLine(report, p1Name, p2Name)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16 print:px-0 print:py-6 print:space-y-10">
      {/* Header */}
      <header className="text-center space-y-3 print:break-after-avoid">
        <h1 className="text-3xl font-bold tracking-tight">
          FRIENDZI · Yin Yang Operating System Diagnostic
        </h1>
        <p className="text-muted-foreground text-sm">
          A structured analysis of operating system compatibility across {report.question_gaps.length} questions
        </p>
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <span>{p1Name}</span>
          <span className="text-muted-foreground">&</span>
          <span>{p2Name}</span>
        </div>
        <p className="text-xs text-muted-foreground">Assessment {new Date(report.generated_at).getFullYear()}</p>
      </header>

      {/* Print button — hidden in print */}
      <div className="flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
        >
          Download / Print PDF
        </button>
      </div>

      {/* Section 1: Three numbers */}
      <Section label="Section One · How you score on all three numbers">
        <SummaryNumbers report={report} />
      </Section>

      {/* Section 2: Cluster alignment */}
      <Section label="Section Two · Cluster Alignment Summary">
        <ClusterTable
          clusters={report.cluster_scores}
          gpa={report.gpa}
          letterGrade={report.letter_grade}
          score={report.score}
        />
      </Section>

      {/* Section 3: Agreement */}
      <Section label="Section Three · Areas of Genuine Agreement">
        <AgreementTable report={report} p1Name={p1Name} p2Name={p2Name} />
      </Section>

      {/* Section 4: Fault lines */}
      <Section label="Section Four · The Fault Lines">
        <FaultLinesSection report={report} p1Name={p1Name} p2Name={p2Name} />
      </Section>

      {/* Section 5: OS Topology */}
      <Section label="Section Five · Operating System Topology">
        <OSTopology
          questionGaps={report.question_gaps}
          p1Name={p1Name}
          p2Name={p2Name}
        />
      </Section>

      {/* Section 6: Surprise factor */}
      <Section label="Section Six · Mutual Knowledge — The Surprise Factor">
        <SurpriseSection report={report} p1Name={p1Name} p2Name={p2Name} />
      </Section>

      {/* Section 7: Profile */}
      <Section label="Section Seven · Compatibility Profile">
        <div className="border rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              Profile {report.profile}
            </span>
            <span className="text-xl font-semibold">{profile.name}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{profile.description}</p>
        </div>
      </Section>

      {/* Section 8: Investment areas */}
      <Section label="Section Eight · What This Profile Actually Requires">
        <InvestmentTable report={report} p1Name={p1Name} p2Name={p2Name} />
      </Section>

      {/* Section 9: Bottom line */}
      <Section label="Friendzi Bottom Line Recommendation">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold leading-tight">{headline}</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </Section>

      {/* Appendix */}
      <Section label="Appendix A · All Questions Ranked by Belief Gap">
        <Appendix report={report} p1Name={p1Name} p2Name={p2Name} />
      </Section>

      {/* Footer */}
      <footer className="text-xs text-muted-foreground text-center border-t pt-6 print:mt-4">
        <p>
          {p1Name} & {p2Name} · YYOSD · {new Date(report.generated_at).getFullYear()}
        </p>
        <p className="mt-1">
          Friendzi does not predict whether a relationship will succeed. It predicts where friction
          will emerge, how expensive that friction may become, and how much structure is required to
          sustain the relationship successfully.
        </p>
      </footer>
    </div>
  )
}
