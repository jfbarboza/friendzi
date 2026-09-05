export type Category = 'Character' | 'Style' | 'Vibe' | 'Fun'

// Gap 0 → SIM_PERFECT, 1-2 → SIM_STRONG (eligibility: gap ≤ 2)
// Gap 3-5 → DIFF_MODERATE, 6-9 → DIFF_LARGE   (eligibility: gap ≥ 3)
export type GapTier = 'SIM_PERFECT' | 'SIM_STRONG' | 'DIFF_MODERATE' | 'DIFF_LARGE'

// Keyed by question number 1–25; values are 1–10
export type Answers = Record<number, number>

export interface Player {
  name: string
  answers: Answers
  predictions: Answers
}

export interface ScoredQuestion {
  questionNumber: number
  questionText: string
  category: Category
  weight: number
  scoreA: number
  scoreB: number
  gap: number
  significance: number
  tier: GapTier
}

export interface PredictionSurprise {
  questionNumber: number
  predicted: number
  actual: number
  error: number
}

export interface Prediction {
  playerAAvgError: number
  playerBAvgError: number
  symmetry: number
  betterPredictor: 'a' | 'b' | 'tied'
  playerABiggestSurprise: PredictionSurprise | null
  playerBBiggestSurprise: PredictionSurprise | null
}

export interface BTIFlags {
  perfectMatch: boolean       // overallMatch === 100 (all 25 gaps are 0)
  emptyDifferences: boolean   // no scored question has gap ≥ 3
  emptySimilarities: boolean  // no scored question has gap ≤ 2
  allNeutral: boolean         // > 60% of answers from either player are exactly 5
  knowledgeAsymmetry: boolean // |A_error - B_error| ≥ 3.0
}

export interface BTIReport {
  players: { a: { name: string }; b: { name: string } }
  scores: {
    overallMatch: number         // 0–100 integer; uses all 25 questions
    characterAlignment: number
    styleAlignment: number
    vibeAlignment: number
  }
  topDifferences: ScoredQuestion[]   // up to 5; scored questions with gap ≥ 3, sorted by significance desc
  topSimilarities: ScoredQuestion[]  // up to 5; scored questions with gap ≤ 2, sorted by significance desc
  conversationStarter: ScoredQuestion | null
  prediction: Prediction
  flags: BTIFlags
}
