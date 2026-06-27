export type QuestionType = 'SCALE' | 'MC'

export type SessionStatus = 'waiting_p2' | 'p1_submitted' | 'complete'

export type PlayerRole = 'p1' | 'p2'

export type CompatibilityProfile = 1 | 2 | 3 | 4

export type GradeLetter = 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'

export interface MCOption {
  label: string        // e.g. "A", "B", "C", "D"
  description: string  // full option text
  value: number        // pre-mapped 1–10 equivalent
}

export interface Question {
  id: string
  question_set_id: string
  cluster_id: string
  text: string
  type: QuestionType
  options: MCOption[] | null  // null for SCALE questions
  order_index: number
  narrative_tags?: string[]   // for narrative engine
}

export interface Cluster {
  id: string
  question_set_id: string
  name: string
  order_index: number
}

export interface QuestionSet {
  id: string
  name: string
  description: string
  slug: string
  created_at: string
  clusters?: Cluster[]
  questions?: Question[]
}

export interface Session {
  id: string
  question_set_id: string
  p1_token: string
  p2_token: string
  p1_name: string | null
  p2_name: string | null
  status: SessionStatus
  created_at: string
}

export interface Answer {
  id: string
  session_id: string
  player_role: PlayerRole
  question_id: string
  own_value: number
  predicted_value: number
}

// Scoring results
export interface QuestionGap {
  question_id: string
  question_text: string
  cluster_name: string
  p1_own: number
  p2_own: number
  p1_predicted_p2: number
  p2_predicted_p1: number
  belief_gap: number
  p1_surprise: number
  p2_surprise: number
  order_index: number
}

export interface ClusterScore {
  cluster_id: string
  cluster_name: string
  avg_gap: number
  grade: GradeLetter
  gpa: number
  match_count: number
  total_count: number
  match_percent: number
}

export interface ReportData {
  session_id: string
  belief_gap: number
  p1_surprise: number
  p2_surprise: number
  avg_surprise: number
  symmetry_score: number
  cluster_scores: ClusterScore[]
  question_gaps: QuestionGap[]
  profile: CompatibilityProfile
  gpa: number
  letter_grade: GradeLetter
  score: number
  generated_at: string
}

// For the narrative engine
export interface NarrativeContext {
  p1_name: string
  p2_name: string
  report: ReportData
  question_gaps: QuestionGap[]
  cluster_scores: ClusterScore[]
}

// API response shapes
export interface CreateSessionResponse {
  session_id: string
  p1_token: string
  share_url: string
}

export interface SessionStatusResponse {
  status: SessionStatus
  p1_name: string | null
  p2_name: string | null
  question_set: { name: string; slug: string }
}
