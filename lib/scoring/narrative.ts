import type { ClusterScore, QuestionGap, ReportData } from '@/types'
import { GRADE_DESCRIPTIONS, PROFILE_LABELS } from './grades'
import {
  getFaultLines,
  getAgreements,
  getP1LargestMisreads,
  getP2LargestMisreads,
} from './algorithm'

// ─── Band labels ──────────────────────────────────────────────────────────────

export function beliefGapBandLabel(gap: number): string {
  if (gap < 1.5) return 'Approaching Strong Alignment'
  if (gap < 2.5) return 'Average Band — Workable'
  if (gap < 3.5) return 'Structural Friction'
  return 'Foundational Mismatch'
}

export function surpriseBandLabel(surprise: number): string {
  if (surprise < 1.5) return 'Genuine Knowledge'
  if (surprise < 2.5) return 'Approaching Genuine Knowledge'
  if (surprise < 3.5) return 'Meaningful Blind Spots'
  return 'Operating on Constructed Assumptions'
}

export function symmetryLabel(score: number): string {
  if (score < 0.5) return 'Symmetric'
  if (score < 1.5) return 'Slightly Asymmetric'
  if (score < 2.5) return 'Asymmetric'
  return 'Highly Asymmetric'
}

// ─── OS Topology ─────────────────────────────────────────────────────────────
// Generates a short operating-system description for each player based on
// their answer patterns. Uses narrative_tags if available on the question,
// otherwise falls back to raw score positions.

export function generateOSTopology(
  playerRole: 'p1' | 'p2',
  questionGaps: QuestionGap[],
  p1Name: string,
  p2Name: string
): string[] {
  const name = playerRole === 'p1' ? p1Name : p2Name
  const getOwn = (g: QuestionGap) => (playerRole === 'p1' ? g.p1_own : g.p2_own)

  const traits: string[] = []

  // Emotional register — Q5 equivalent (feelings matter to civilizational health)
  const feelingsQ = questionGaps.find((g) =>
    g.question_text.toLowerCase().includes('feelings don\'t care')
  )
  if (feelingsQ) {
    const v = getOwn(feelingsQ)
    if (v >= 7)
      traits.push('Dual-track rationalist — treats emotional data as legitimate civilizational signal alongside factual data.')
    else if (v <= 3)
      traits.push('Pure rationalist — emotional data registers near zero as civilizational input.')
    else
      traits.push('Calibrated rationalist — acknowledges emotional data but does not weight it equally to factual evidence.')
  }

  // Accountability stance
  const empathyQ = questionGaps.find((g) =>
    g.question_text.toLowerCase().includes('empathy without accountability')
  )
  if (empathyQ) {
    const v = getOwn(empathyQ)
    if (v >= 8) traits.push('Accountability-first — empathy without accountability is viewed as an obstacle, not a virtue.')
    else if (v <= 4) traits.push('Empathy-first — prioritizes relational safety over accountability processes.')
    else traits.push('Balanced on accountability — holds both empathy and accountability as context-dependent.')
  }

  // Relational duty
  const dutyQ = questionGaps.find((g) =>
    g.question_text.toLowerCase().includes('all relationships are fundamentally voluntary')
  )
  if (dutyQ) {
    const v = getOwn(dutyQ)
    if (v <= 3)
      traits.push('Duty-based relational architecture — relational history generates real obligation beyond consent.')
    else if (v >= 7)
      traits.push('Consent-first relational architecture — relationships are fundamentally voluntary and exit is always a right.')
    else
      traits.push('Mixed relational model — recognizes both consent-based and duty-based relational obligations.')
  }

  // Exit ethics
  const ghostQ = questionGaps.find((g) =>
    g.question_text.toLowerCase().includes('ghosting')
  )
  if (ghostQ) {
    const v = getOwn(ghostQ)
    if (v >= 8) traits.push('Hardline on relational exit ethics — ghosting and bad boundaries are violations, not preferences.')
    else if (v <= 4) traits.push('Permissive on relational exit — exit without explanation is sometimes the appropriate choice.')
  }

  // Civilizational standards
  const civilQ = questionGaps.find((g) =>
    g.question_text.toLowerCase().includes('shared moral standards')
  )
  if (civilQ) {
    const v = getOwn(civilQ)
    if (v >= 8) traits.push('Hardline on civilizational standards — no shared moral floor means no civilization.')
    else if (v <= 4) traits.push('Pluralist on civilizational standards — moral diversity is a feature, not a threat.')
  }

  // Political floor
  const demQ = questionGaps.find((g) =>
    g.question_text.toLowerCase().includes('democratic party')
  )
  const repQ = questionGaps.find((g) =>
    g.question_text.toLowerCase().includes('republican party')
  )
  if (demQ && repQ) {
    const demV = getOwn(demQ)
    const repV = getOwn(repQ)
    if (demV >= 7 && repV >= 7) traits.push('Both-sidesist on institutional threat — views both major parties as dangers to different values.')
    else if (demV >= 7) traits.push('Concerned primarily about the left\'s threat to free expression and institutional trust.')
    else if (repV >= 7) traits.push('Concerned primarily about the right\'s threat to democratic norms.')
  }

  if (traits.length === 0) {
    traits.push(`${name} has a complex operating system that does not resolve neatly into standard categories.`)
  }

  return traits
}

// ─── Investment areas ─────────────────────────────────────────────────────────

export interface InvestmentArea {
  title: string
  description: string
}

export function generateInvestmentAreas(
  report: ReportData,
  p1Name: string,
  p2Name: string
): InvestmentArea[] {
  const faultLines = getFaultLines(report)
  const areas: InvestmentArea[] = []

  for (const fl of faultLines.slice(0, 4)) {
    const gapDesc = faultLineNarrative(fl, p1Name, p2Name)
    if (gapDesc) areas.push(gapDesc)
  }

  // Always add: reduce surprise factor if above 2.0
  if (report.avg_surprise > 2.0) {
    const higherSurprise = report.p1_surprise > report.p2_surprise ? p1Name : p2Name
    areas.push({
      title: 'Reduce the Surprise Factor below 1.5',
      description: `Moving ${higherSurprise}'s read of their counterpart is the primary work number. The blind spots are specific and nameable. A structured dialogue closes most of the gap.`,
    })
  }

  // Conflict architecture note
  const conflictCluster = report.cluster_scores.find((c) =>
    c.cluster_name.toLowerCase().includes('conflict')
  )
  if (conflictCluster && conflictCluster.match_percent < 40) {
    areas.push({
      title: 'Conflict Architecture Pre-Agreement',
      description: `${p1Name} and ${p2Name} process conflict differently at almost every step (${conflictCluster.match_percent}% alignment). Pre-agreeing on how conflict will be handled prevents each party from defaulting to their own OS under pressure.`,
    })
  }

  // Name civilizational floor as an anchor
  const strongClusters = report.cluster_scores.filter((c) => c.avg_gap < 1.5)
  if (strongClusters.length >= 2) {
    areas.push({
      title: 'Leverage the Civilizational Floor',
      description: `The shared foundation on ${strongClusters.map((c) => c.cluster_name).join(', ')} is stronger than either party may realize. Explicitly naming what you agree on provides the ballast for navigating what you don't.`,
    })
  }

  return areas
}

function faultLineNarrative(
  gap: QuestionGap,
  p1Name: string,
  p2Name: string
): InvestmentArea | null {
  const text = gap.question_text.toLowerCase()

  if (text.includes('feelings don\'t care')) {
    return {
      title: `Name the Emotional Register Divergence`,
      description: `${p1Name} scores ${gap.p1_own} and ${p2Name} scores ${gap.p2_own} on whether feelings matter to civilizational health (gap: ${gap.belief_gap}). One explicit conversation about this changes the interpretive frame for hundreds of future exchanges.`,
    }
  }
  if (text.includes('all relationships are fundamentally voluntary')) {
    return {
      title: 'Negotiate the Relational Duty Question',
      description: `${p1Name} scores ${gap.p1_own} and ${p2Name} scores ${gap.p2_own} on whether relationships generate inherent duty (gap: ${gap.belief_gap}). One believes history creates obligation; the other believes exit is always a right. These need to be reconciled before any deep commitment is built.`,
    }
  }
  if (text.includes('boundaries')) {
    return {
      title: 'Align on Relational Exit Ethics',
      description: `${p1Name} and ${p2Name} hold meaningfully different views on what constitutes a legitimate exit from a relationship (gap: ${gap.belief_gap}). Surface this before it becomes the subject of the next conflict.`,
    }
  }
  if (text.includes('ghosting')) {
    return {
      title: 'Define Acceptable Exit Conditions',
      description: `${p1Name} scores ${gap.p1_own} and ${p2Name} scores ${gap.p2_own} on whether ghosting is ever legitimate (gap: ${gap.belief_gap}). Agreeing on what constitutes an acceptable relational exit prevents future violations.`,
    }
  }
  // Generic for any other fault line
  return {
    title: `Address the "${gap.question_text.slice(0, 50)}…" Divergence`,
    description: `${p1Name} scored ${gap.p1_own} and ${p2Name} scored ${gap.p2_own} — a gap of ${gap.belief_gap}. This divergence will surface under pressure. Naming it in advance reduces its cost.`,
  }
}

// ─── Bottom line ──────────────────────────────────────────────────────────────

export function generateBottomLine(
  report: ReportData,
  p1Name: string,
  p2Name: string
): { headline: string; paragraphs: string[] } {
  const profile = PROFILE_LABELS[report.profile]
  const faultLines = getFaultLines(report)
  const agreements = getAgreements(report)

  const headline =
    report.belief_gap < 2.5
      ? 'This Relationship Has Real Infrastructure. Invest in It Deliberately.'
      : report.belief_gap < 3.5
      ? 'Real Differences. Workable With Structure.'
      : 'Foundational Divergence. Governance Architecture Required.'

  const paragraphs: string[] = []

  paragraphs.push(
    `A belief gap of ${report.belief_gap} puts ${p1Name} and ${p2Name} in the ${beliefGapBandLabel(report.belief_gap).toLowerCase()} range. ` +
      (report.belief_gap < 2.5
        ? 'This relationship does not sit above the structural alarm threshold. It does not require governance architecture to remain functional.'
        : 'This gap requires active management — not goodwill alone.')
  )

  if (faultLines.length > 0) {
    paragraphs.push(
      `The fault lines — ${faultLines
        .slice(0, 3)
        .map((f) => f.question_text.slice(0, 40).trim() + '…')
        .join('; ')} — are real. But ${faultLines.length} fault lines across ${report.question_gaps.length} questions means ${Math.round((1 - faultLines.length / report.question_gaps.length) * 100)}% of the instrument returned either agreement or workable friction.`
    )
  }

  if (agreements.length >= 5) {
    paragraphs.push(
      `The shared foundation is load-bearing: ${agreements.length} questions at gap 0–1 signals that both people share a common epistemic and moral floor. That foundation is what makes this relationship worth the investment.`
    )
  }

  paragraphs.push(
    `The real question Friendzi asks is not whether two people are compatible. It is whether they are willing to do the work that their gap requires. At ${report.belief_gap}, that work is ${report.belief_gap < 2.5 ? 'not heroic — it is honest conversation, deliberate investment, and the willingness to name what is true' : 'real — it requires structure, pre-agreement on conflict, and named acknowledgment of the divergences'}.`
  )

  return { headline, paragraphs }
}

// ─── Surprise narrative ───────────────────────────────────────────────────────

export function generateSurpriseNarrative(
  report: ReportData,
  p1Name: string,
  p2Name: string
): { p1Summary: string; p2Summary: string } {
  const p1Misreads = getP1LargestMisreads(report, 3)
  const p2Misreads = getP2LargestMisreads(report, 3)

  const p1Band = surpriseBandLabel(report.p1_surprise)
  const p2Band = surpriseBandLabel(report.p2_surprise)

  const p1Summary =
    `${p1Name} predicts ${p2Name} at ${report.p1_surprise} — ${p1Band.toLowerCase()}. ` +
    (p1Misreads.length > 0
      ? `Largest misreads: ${p1Misreads.map((m) => `"${m.question_text.slice(0, 35)}…" (gap ${m.p1_surprise})`).join('; ')}.`
      : '')

  const p2Summary =
    `${p2Name} predicts ${p1Name} at ${report.p2_surprise} — ${p2Band.toLowerCase()}. ` +
    (p2Misreads.length > 0
      ? `Largest misreads: ${p2Misreads.map((m) => `"${m.question_text.slice(0, 35)}…" (gap ${m.p2_surprise})`).join('; ')}.`
      : '')

  return { p1Summary, p2Summary }
}
