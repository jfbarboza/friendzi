import type {
  Answer,
  Cluster,
  ClusterScore,
  CompatibilityProfile,
  GradeLetter,
  Question,
  QuestionGap,
  ReportData,
} from '@/types'
import {
  gapToGrade,
  gradeToGpa,
  gpaToLetterGrade,
  gpaToScore,
} from './grades'

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function absGap(a: number, b: number): number {
  return Math.abs(a - b)
}

export function computeReport(
  sessionId: string,
  questions: Question[],
  clusters: Cluster[],
  p1Answers: Answer[],
  p2Answers: Answer[]
): ReportData {
  // Index answers by question_id for O(1) lookup
  const p1Map = new Map(p1Answers.map((a) => [a.question_id, a]))
  const p2Map = new Map(p2Answers.map((a) => [a.question_id, a]))
  const clusterMap = new Map(clusters.map((c) => [c.id, c]))

  const questionGaps: QuestionGap[] = []

  for (const q of questions) {
    const p1 = p1Map.get(q.id)
    const p2 = p2Map.get(q.id)
    if (!p1 || !p2) continue

    const beliefGap = absGap(p1.own_value, p2.own_value)
    const p1Surprise = absGap(p1.predicted_value, p2.own_value)
    const p2Surprise = absGap(p2.predicted_value, p1.own_value)

    questionGaps.push({
      question_id: q.id,
      question_text: q.text,
      cluster_name: clusterMap.get(q.cluster_id)?.name ?? '',
      p1_own: p1.own_value,
      p2_own: p2.own_value,
      p1_predicted_p2: p1.predicted_value,
      p2_predicted_p1: p2.predicted_value,
      belief_gap: beliefGap,
      p1_surprise: p1Surprise,
      p2_surprise: p2Surprise,
      order_index: q.order_index,
    })
  }

  // Overall metrics
  const overallBeliefGap = mean(questionGaps.map((g) => g.belief_gap))
  const p1SurpriseFactor = mean(questionGaps.map((g) => g.p1_surprise))
  const p2SurpriseFactor = mean(questionGaps.map((g) => g.p2_surprise))
  const avgSurpriseFactor = mean([p1SurpriseFactor, p2SurpriseFactor])
  const symmetryScore = absGap(p1SurpriseFactor, p2SurpriseFactor)

  // Per-cluster scores
  const clusterScores: ClusterScore[] = clusters.map((cluster) => {
    const clusterGaps = questionGaps.filter((g) => g.cluster_name === cluster.name)
    const avgGap = mean(clusterGaps.map((g) => g.belief_gap))
    const grade = gapToGrade(avgGap)
    const gpa = gradeToGpa(grade)
    const matchCount = clusterGaps.filter((g) => g.belief_gap <= 1).length

    return {
      cluster_id: cluster.id,
      cluster_name: cluster.name,
      avg_gap: avgGap,
      grade,
      gpa,
      match_count: matchCount,
      total_count: clusterGaps.length,
      match_percent: clusterGaps.length > 0 ? Math.round((matchCount / clusterGaps.length) * 100) : 0,
    }
  })

  // Relationship GPA = weighted mean of cluster GPAs (weighted by question count)
  const totalQuestions = clusterScores.reduce((s, c) => s + c.total_count, 0)
  const weightedGpa =
    totalQuestions > 0
      ? clusterScores.reduce((s, c) => s + c.gpa * c.total_count, 0) / totalQuestions
      : 0

  const letterGrade = computeLetterGrade(weightedGpa)
  const score = gpaToScore(weightedGpa)
  const profile = computeProfile(overallBeliefGap, avgSurpriseFactor)

  return {
    session_id: sessionId,
    belief_gap: round2(overallBeliefGap),
    p1_surprise: round2(p1SurpriseFactor),
    p2_surprise: round2(p2SurpriseFactor),
    avg_surprise: round2(avgSurpriseFactor),
    symmetry_score: round2(symmetryScore),
    cluster_scores: clusterScores.map((cs) => ({
      ...cs,
      avg_gap: round2(cs.avg_gap),
    })),
    question_gaps: questionGaps,
    profile,
    gpa: round2(weightedGpa),
    letter_grade: letterGrade,
    score,
    generated_at: new Date().toISOString(),
  }
}

function computeLetterGrade(gpa: number): GradeLetter {
  // B+ band sits between A and B
  if (gpa >= 3.7) return 'A'
  if (gpa >= 3.3) return 'B+'
  if (gpa >= 2.5) return 'B'
  if (gpa >= 1.5) return 'C'
  if (gpa >= 0.5) return 'D'
  return 'F'
}

function computeProfile(beliefGap: number, avgSurprise: number): CompatibilityProfile {
  const compatible = beliefGap < 2.5
  const aware = avgSurprise < 2.5
  if (compatible && aware) return 1
  if (compatible && !aware) return 2
  if (!compatible && aware) return 3
  return 4
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Convenience queries on a computed report
export function getFaultLines(report: ReportData): QuestionGap[] {
  return report.question_gaps
    .filter((g) => g.belief_gap >= 4)
    .sort((a, b) => b.belief_gap - a.belief_gap)
}

export function getAgreements(report: ReportData): QuestionGap[] {
  return report.question_gaps
    .filter((g) => g.belief_gap <= 1)
    .sort((a, b) => a.belief_gap - b.belief_gap)
}

export function getFrictionZones(report: ReportData): QuestionGap[] {
  return report.question_gaps
    .filter((g) => g.belief_gap >= 2 && g.belief_gap < 4)
    .sort((a, b) => b.belief_gap - a.belief_gap)
}

export function getAllQuestionsSorted(report: ReportData): QuestionGap[] {
  return [...report.question_gaps].sort((a, b) => b.belief_gap - a.belief_gap)
}

export function getP1LargestMisreads(report: ReportData, count = 5): QuestionGap[] {
  return [...report.question_gaps]
    .sort((a, b) => b.p1_surprise - a.p1_surprise)
    .slice(0, count)
}

export function getP2LargestMisreads(report: ReportData, count = 5): QuestionGap[] {
  return [...report.question_gaps]
    .sort((a, b) => b.p2_surprise - a.p2_surprise)
    .slice(0, count)
}
