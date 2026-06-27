import type { GradeLetter } from '@/types'

export function gapToGrade(avgGap: number): GradeLetter {
  if (avgGap < 1.5) return 'A'
  if (avgGap < 2.5) return 'B'
  if (avgGap < 3.5) return 'C'
  if (avgGap < 5.0) return 'D'
  return 'F'
}

export function gradeToGpa(grade: GradeLetter): number {
  const map: Record<GradeLetter, number> = {
    A: 4.0,
    'B+': 3.43,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  }
  return map[grade]
}

export function gpaToLetterGrade(gpa: number): GradeLetter {
  if (gpa >= 3.7) return 'A'
  if (gpa >= 3.3) return 'B+'
  if (gpa >= 2.5) return 'B'
  if (gpa >= 1.5) return 'C'
  if (gpa >= 0.5) return 'D'
  return 'F'
}

export function gpaToScore(gpa: number): number {
  // Map 0–4.0 GPA to 0–100 score
  return Math.round((gpa / 4.0) * 100)
}

export function gapToColor(gap: number): 'red' | 'amber' | 'gray' | 'green' {
  if (gap >= 4) return 'red'
  if (gap >= 2) return 'amber'
  if (gap >= 1) return 'gray'
  return 'green'
}

export const GRADE_DESCRIPTIONS: Record<GradeLetter, { belief: string; surprise: string }> = {
  A: {
    belief: 'Strong natural alignment. Can run on goodwill.',
    surprise: 'Genuine knowledge. The finish-each-other\'s-sentences level.',
  },
  'B+': {
    belief: 'Approaching strong alignment.',
    surprise: 'Approaching genuine knowledge.',
  },
  B: {
    belief: 'Real differences but workable. Honest communication bridges most friction.',
    surprise: 'Average mutual understanding. Normal range. Improvable.',
  },
  C: {
    belief: 'Structural friction. Foundational differences. Active management required.',
    surprise: 'Meaningful blind spots. Systematic misreads in specific categories.',
  },
  D: {
    belief: 'Foundational mismatch. The kryptonite number. Requires documented structure.',
    surprise: 'Operating on constructed assumptions. High risk of costly surprises.',
  },
  F: {
    belief: 'Operating system incompatibility.',
    surprise: 'Operating on constructed assumptions. High risk of costly surprises.',
  },
}

export const PROFILE_LABELS: Record<number, { name: string; description: string }> = {
  1: {
    name: 'Compatible & Aware',
    description:
      'Low belief gap. Good surprise factor. Highest natural probability. Can run on goodwill with minimal structure.',
  },
  2: {
    name: 'Compatible but Blind',
    description:
      'Low belief gap. Poor surprise factor. More compatible than they realize. Investment in mutual knowledge unlocks the full potential.',
  },
  3: {
    name: 'Incompatible but Aware',
    description:
      'High belief gap. Average surprise factor. Mismatch is real and sensed. Requires structure, not goodwill.',
  },
  4: {
    name: 'Incompatible & Blind',
    description:
      'High belief gap. Poor surprise factor. Most dangerous. Mismatch unseen. Highest risk of costly surprise.',
  },
}
