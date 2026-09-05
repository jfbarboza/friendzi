import type { Category } from './types'

export interface QuestionMeta {
  readonly number: number
  readonly text: string
  readonly weight: number
  readonly category: Category
}

// Authoritative from JKC spec:
//   Character (weight 5): Q11, Q15, Q17, Q22, Q25
//   Style     (weight 4): Q5, Q7, Q8, Q12, Q13, Q14, Q19, Q21, Q24
//   Vibe      (weight 3): Q2, Q4, Q10, Q16, Q18, Q20, Q23
//   Fun       (weight 2): Q1, Q3, Q6, Q9  — scored for Overall Match, never surfaced in report
export const QUESTIONS: readonly QuestionMeta[] = [
  { number:  1, weight: 2, category: 'Fun',       text: 'I am a morning person.' },
  { number:  2, weight: 3, category: 'Vibe',      text: 'I laugh at my own jokes.' },
  { number:  3, weight: 2, category: 'Fun',       text: 'I usually arrive a few minutes early.' },
  { number:  4, weight: 3, category: 'Vibe',      text: 'I can make small talk with almost anyone.' },
  { number:  5, weight: 4, category: 'Style',     text: 'I return my shopping cart every time.' },
  { number:  6, weight: 2, category: 'Fun',       text: 'I sing along in the car when my favorite song comes on.' },
  { number:  7, weight: 4, category: 'Style',     text: 'Being on time is a sign of respect.' },
  { number:  8, weight: 4, category: 'Style',     text: 'I recharge by spending time alone.' },
  { number:  9, weight: 2, category: 'Fun',       text: 'I make my bed almost every morning.' },
  { number: 10, weight: 3, category: 'Vibe',      text: "I enjoy trying foods I've never had before." },
  { number: 11, weight: 5, category: 'Character', text: 'My actual and documented tipping history proves I am a generous tipper.' },
  { number: 12, weight: 4, category: 'Style',     text: 'I would rather listen than do most of the talking.' },
  { number: 13, weight: 4, category: 'Style',     text: 'I read the instructions before I start.' },
  { number: 14, weight: 4, category: 'Style',     text: 'I get way too competitive during games.' },
  { number: 15, weight: 5, category: 'Character', text: 'I tend to trust people quickly.' },
  { number: 16, weight: 3, category: 'Vibe',      text: 'I usually have more tabs open than I need.' },
  { number: 17, weight: 5, category: 'Character', text: "I don't stay angry for very long." },
  { number: 18, weight: 3, category: 'Vibe',      text: 'I check reviews before buying almost anything.' },
  { number: 19, weight: 4, category: 'Style',     text: 'I am usually the one who reaches out first.' },
  { number: 20, weight: 3, category: 'Vibe',      text: 'I still feel like a kid sometimes.' },
  { number: 21, weight: 4, category: 'Style',     text: 'I mostly finish what I start.' },
  { number: 22, weight: 5, category: 'Character', text: "If someone cuts in line, I'll probably say something." },
  { number: 23, weight: 3, category: 'Vibe',      text: "I'd rather call someone than send a text." },
  { number: 24, weight: 4, category: 'Style',     text: 'I remember little details that people tell me.' },
  { number: 25, weight: 5, category: 'Character', text: 'I sometimes apologize just to keep the peace.' },
] as const

export const CHARACTER_QS = QUESTIONS.filter(q => q.category === 'Character')
export const STYLE_QS     = QUESTIONS.filter(q => q.category === 'Style')
export const VIBE_QS      = QUESTIONS.filter(q => q.category === 'Vibe')
export const FUN_QS       = QUESTIONS.filter(q => q.category === 'Fun')
export const SCORED_QS    = QUESTIONS.filter(q => q.category !== 'Fun')  // 21 questions
