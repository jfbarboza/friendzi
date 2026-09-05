import { describe, it, expect, beforeAll } from 'vitest'
import { computeReport } from '../algorithm'
import type { Answers, Player, BTIReport } from '../types'
import { QUESTIONS } from '../questions'

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeAnswers(opts: {
  char?: number
  style?: number
  vibe?: number
  fun?: number
  overrides?: Record<number, number>
}): Answers {
  const a: Answers = {}
  for (const q of QUESTIONS) {
    let val = 5
    if (q.category === 'Character' && opts.char !== undefined) val = opts.char
    else if (q.category === 'Style' && opts.style !== undefined) val = opts.style
    else if (q.category === 'Vibe' && opts.vibe !== undefined) val = opts.vibe
    else if (q.category === 'Fun' && opts.fun !== undefined) val = opts.fun
    a[q.number] = val
  }
  if (opts.overrides) Object.assign(a, opts.overrides)
  return a
}

function makePlayer(name: string, answers: Answers, predictions?: Answers): Player {
  return { name, answers, predictions: predictions ?? { ...answers } }
}

// ── Test 1 · Perfect Twins ────────────────────────────────────────────────────
// All 25 questions: A = 7, B = 7, predictions = 7
// Spec: 100% everywhere; empty diff pool; top-5 sims are Character questions; perfectMatch flag
describe('TC1 · Perfect Twins', () => {
  let report: BTIReport
  beforeAll(() => {
    const answers = makeAnswers({ char: 7, style: 7, vibe: 7, fun: 7 })
    report = computeReport(makePlayer('Alex', answers), makePlayer('Sam', answers))
  })

  it('overall match = 100', () => {
    expect(report.scores.overallMatch).toBe(100)
  })
  it('all category alignments = 100', () => {
    expect(report.scores.characterAlignment).toBe(100)
    expect(report.scores.styleAlignment).toBe(100)
    expect(report.scores.vibeAlignment).toBe(100)
  })
  it('differences pool is empty', () => {
    expect(report.topDifferences).toHaveLength(0)
  })
  it('top 5 similarities are the 5 Character questions (highest significance 5×9=45)', () => {
    expect(report.topSimilarities).toHaveLength(5)
    const charNums = new Set([11, 15, 17, 22, 25])
    for (const s of report.topSimilarities) expect(charNums).toContain(s.questionNumber)
  })
  it('all top similarities have SIM_PERFECT tier', () => {
    for (const s of report.topSimilarities) expect(s.tier).toBe('SIM_PERFECT')
  })
  it('each top similarity has significance = 45 (weight 5 × (9 - 0))', () => {
    for (const s of report.topSimilarities) expect(s.significance).toBe(45)
  })
  it('conversation starter is a Character question with SIM_PERFECT tier (diff-pool fallback)', () => {
    expect(report.conversationStarter).not.toBeNull()
    expect(report.conversationStarter!.tier).toBe('SIM_PERFECT')
    expect([11, 15, 17, 22, 25]).toContain(report.conversationStarter!.questionNumber)
  })
  it('flags: perfectMatch = true, emptyDifferences = true', () => {
    expect(report.flags.perfectMatch).toBe(true)
    expect(report.flags.emptyDifferences).toBe(true)
  })
  it('prediction error = 0 for both players', () => {
    expect(report.prediction.playerAAvgError).toBe(0)
    expect(report.prediction.playerBAvgError).toBe(0)
    expect(report.prediction.symmetry).toBe(0)
  })
})

// ── Test 2 · Total Opposites ──────────────────────────────────────────────────
// Char: A=1, B=10 (gap 9); Style: A=2, B=9 (gap 7); Vibe: A=2, B=8 (gap 6); Fun: A=3, B=8 (gap 5)
// Sum = 5×9 + 9×7 + 7×6 + 4×5 = 170; avg = 6.8 → overall = round(24.44) = 24
// char_align = 0; style_align = round(22.22) = 22; vibe_align = round(33.33) = 33
// Spec: top-5 diff = all Character questions (sig=45); sim pool empty; emptySimilarities flag
describe('TC2 · Total Opposites', () => {
  let report: BTIReport
  beforeAll(() => {
    const aA = makeAnswers({ char: 1,  style: 2, vibe: 2, fun: 3 })
    const bA = makeAnswers({ char: 10, style: 9, vibe: 8, fun: 8 })
    report = computeReport(makePlayer('River', aA), makePlayer('Jordan', bA))
  })

  it('overall match = 24', () => {
    expect(report.scores.overallMatch).toBe(24)
  })
  it('character alignment = 0', () => {
    expect(report.scores.characterAlignment).toBe(0)
  })
  it('style alignment = 22', () => {
    expect(report.scores.styleAlignment).toBe(22)
  })
  it('vibe alignment = 33', () => {
    expect(report.scores.vibeAlignment).toBe(33)
  })
  it('top 5 differences are all Character questions (sig 5×9=45)', () => {
    expect(report.topDifferences).toHaveLength(5)
    const charNums = new Set([11, 15, 17, 22, 25])
    for (const d of report.topDifferences) expect(charNums).toContain(d.questionNumber)
  })
  it('all differences have DIFF_LARGE tier (gap 9, sig 45)', () => {
    for (const d of report.topDifferences) {
      expect(d.tier).toBe('DIFF_LARGE')
      expect(d.gap).toBe(9)
      expect(d.significance).toBe(45)
    }
  })
  it('similarities pool is empty', () => {
    expect(report.topSimilarities).toHaveLength(0)
  })
  it('flags: emptySimilarities = true', () => {
    expect(report.flags.emptySimilarities).toBe(true)
  })
  it('conversation starter is a Character question', () => {
    expect(report.conversationStarter).not.toBeNull()
    expect([11, 15, 17, 22, 25]).toContain(report.conversationStarter!.questionNumber)
  })
})

// ── Test 3 · Surface Lookalikes / Deep Strangers ──────────────────────────────
// Vibe: gap 0 (both 7) → vibe 100%; Style: gap 5 → style 44%; Char: gap 7 → char 22%
// Fun: gap 0 (both 6)
// Sum = 5×7 + 9×5 + 7×0 + 4×0 = 80; avg = 3.2 → overall = round(64.44) = 64
// Spec: top diff = char questions (sig 5×7=35 beats style 4×5=20); top sim = vibe (sig 3×9=27)
describe('TC3 · Surface Lookalikes / Deep Strangers', () => {
  let report: BTIReport
  beforeAll(() => {
    const aA = makeAnswers({ char: 2, style: 3, vibe: 7, fun: 6 })
    const bA = makeAnswers({ char: 9, style: 8, vibe: 7, fun: 6 })
    report = computeReport(makePlayer('Kim', aA), makePlayer('Lee', bA))
  })

  it('overall match = 64', () => {
    expect(report.scores.overallMatch).toBe(64)
  })
  it('vibe alignment = 100 (all gaps 0)', () => {
    expect(report.scores.vibeAlignment).toBe(100)
  })
  it('style alignment = 44', () => {
    expect(report.scores.styleAlignment).toBe(44)
  })
  it('character alignment = 22', () => {
    expect(report.scores.characterAlignment).toBe(22)
  })
  it('top 5 differences are all Character questions (higher significance than Style)', () => {
    expect(report.topDifferences).toHaveLength(5)
    const charNums = new Set([11, 15, 17, 22, 25])
    for (const d of report.topDifferences) expect(charNums).toContain(d.questionNumber)
  })
  it('Character diff significance = 35 (weight 5 × gap 7)', () => {
    for (const d of report.topDifferences) expect(d.significance).toBe(35)
  })
  it('top similarities are Vibe questions (only pool with gap ≤ 2)', () => {
    const vibeNums = new Set([2, 4, 10, 16, 18, 20, 23])
    for (const s of report.topSimilarities) expect(vibeNums).toContain(s.questionNumber)
  })
  it('vibe sim significance = 27 (weight 3 × (9 - 0))', () => {
    for (const s of report.topSimilarities) expect(s.significance).toBe(27)
  })
  it('conversation starter is a Character question (first char in diff pool)', () => {
    expect(report.conversationStarter).not.toBeNull()
    expect([11, 15, 17, 22, 25]).toContain(report.conversationStarter!.questionNumber)
  })
})

// ── Test 4 · Surface Strangers / Deep Twins ───────────────────────────────────
// Char: A=8, B=8 (gap 0) → char 100%; Style: gap 4 → style 56%; Vibe: gap 6 → vibe 33%
// Fun: gap 5
// Sum = 5×0 + 9×4 + 7×6 + 4×5 = 98; avg = 3.92 → overall = round(56.44) = 56
// Spec: char in sim pool only; conv starter falls back to Style (no char in diff pool)
describe('TC4 · Surface Strangers / Deep Twins', () => {
  let report: BTIReport
  beforeAll(() => {
    const aA = makeAnswers({ char: 8, style: 4, vibe: 3, fun: 3 })
    const bA = makeAnswers({ char: 8, style: 8, vibe: 9, fun: 8 })
    report = computeReport(makePlayer('Jorge', aA), makePlayer('Jay', bA))
  })

  it('character alignment = 100', () => {
    expect(report.scores.characterAlignment).toBe(100)
  })
  it('overall match = 56', () => {
    expect(report.scores.overallMatch).toBe(56)
  })
  it('style alignment = 56', () => {
    expect(report.scores.styleAlignment).toBe(56)
  })
  it('vibe alignment = 33', () => {
    expect(report.scores.vibeAlignment).toBe(33)
  })
  it('top 5 similarities are all Character questions (sig 5×9=45)', () => {
    expect(report.topSimilarities).toHaveLength(5)
    const charNums = new Set([11, 15, 17, 22, 25])
    for (const s of report.topSimilarities) expect(charNums).toContain(s.questionNumber)
  })
  it('all character similarities have SIM_PERFECT tier', () => {
    for (const s of report.topSimilarities) expect(s.tier).toBe('SIM_PERFECT')
  })
  it('top differences contain no Character questions (char is in sim pool)', () => {
    const charNums = new Set([11, 15, 17, 22, 25])
    for (const d of report.topDifferences) expect(charNums).not.toContain(d.questionNumber)
  })
  it('top differences are Vibe questions (sig 3×6=18 ranked above Style 4×4=16)', () => {
    const vibeNums = new Set([2, 4, 10, 16, 18, 20, 23])
    for (const d of report.topDifferences) expect(vibeNums).toContain(d.questionNumber)
  })
  it('conversation starter falls back to a Style question (no char in diff pool)', () => {
    expect(report.conversationStarter).not.toBeNull()
    const styleNums = new Set([5, 7, 8, 12, 13, 14, 19, 21, 24])
    expect(styleNums).toContain(report.conversationStarter!.questionNumber)
  })
})

// ── Test 5 · Different But Know Each Other Cold ───────────────────────────────
// Char: A=3, B=8 (gap 5); Style: A=4, B=7 (gap 3); Vibe: A=5, B=8 (gap 3); Fun: both 5
// Both players predict the other's actual scores exactly → prediction error = 0 for both
// Spec: special "mutual knowledge" message; both biggest-surprise = null
describe('TC5 · Different But Know Each Other Cold', () => {
  let report: BTIReport
  beforeAll(() => {
    const aAnswers = makeAnswers({ char: 3, style: 4, vibe: 5, fun: 5 })
    const bAnswers = makeAnswers({ char: 8, style: 7, vibe: 8, fun: 5 })
    report = computeReport(
      makePlayer('Quinn', aAnswers, { ...bAnswers }),  // A predicts B exactly
      makePlayer('Riley', bAnswers, { ...aAnswers }),  // B predicts A exactly
    )
  })

  it('prediction error for both players is 0', () => {
    expect(report.prediction.playerAAvgError).toBe(0)
    expect(report.prediction.playerBAvgError).toBe(0)
  })
  it('symmetry is 0', () => {
    expect(report.prediction.symmetry).toBe(0)
  })
  it('betterPredictor = "tied"', () => {
    expect(report.prediction.betterPredictor).toBe('tied')
  })
  it('no biggest-surprise questions (all errors were 0)', () => {
    expect(report.prediction.playerABiggestSurprise).toBeNull()
    expect(report.prediction.playerBBiggestSurprise).toBeNull()
  })
  it('knowledgeAsymmetry flag is false (|0 - 0| < 3)', () => {
    expect(report.flags.knowledgeAsymmetry).toBe(false)
  })
})

// ── Test 6 · Identical But Blind ─────────────────────────────────────────────
// All scored questions: A=8, B=8 (gap 0 → overall 100%)
// A predicts all 1s for B → error = |1-8| = 7 per question → avg error = 7
// B predicts all 10s for A → error = |10-8| = 2 per question → avg error = 2
// Spec: 100% match + terrible predictions; knowledgeAsymmetry flag; B is better predictor
describe('TC6 · Identical But Blind', () => {
  let report: BTIReport
  beforeAll(() => {
    const allEights   = makeAnswers({ char: 8, style: 8, vibe: 8, fun: 8 })
    const predictOnes = makeAnswers({ char: 1, style: 1, vibe: 1, fun: 1 })
    const predictTens = makeAnswers({ char: 10, style: 10, vibe: 10, fun: 10 })
    report = computeReport(
      makePlayer('Casey',  allEights, predictOnes),  // A predicts all 1s for B (actual 8)
      makePlayer('Morgan', allEights, predictTens),   // B predicts all 10s for A (actual 8)
    )
  })

  it('overall match = 100 (all gaps 0)', () => {
    expect(report.scores.overallMatch).toBe(100)
  })
  it('no differences', () => {
    expect(report.topDifferences).toHaveLength(0)
  })
  it('player A avg prediction error = 7 (predicted 1, actual 8)', () => {
    expect(report.prediction.playerAAvgError).toBe(7)
  })
  it('player B avg prediction error = 2 (predicted 10, actual 8)', () => {
    expect(report.prediction.playerBAvgError).toBe(2)
  })
  it('symmetry = 5 (|7 - 2|)', () => {
    expect(report.prediction.symmetry).toBe(5)
  })
  it('knowledgeAsymmetry flag is set (|7 - 2| = 5 ≥ 3)', () => {
    expect(report.flags.knowledgeAsymmetry).toBe(true)
  })
  it('B is identified as the better predictor', () => {
    expect(report.prediction.betterPredictor).toBe('b')
  })
})

// ── Test 7 · Asymmetric Knowledge ────────────────────────────────────────────
// All: A=6, B=7 (gap 1 everywhere) → overall = round(88.89) = 89
// A predicts B exactly → A avg error = 0
// B predicts A as all 1s → B avg error = |1-6| = 5 per question
// Spec: knowledgeAsymmetry flag; A is better predictor
describe('TC7 · Asymmetric Knowledge', () => {
  let report: BTIReport
  beforeAll(() => {
    const aAnswers  = makeAnswers({ char: 6, style: 6, vibe: 6, fun: 6 })
    const bAnswers  = makeAnswers({ char: 7, style: 7, vibe: 7, fun: 7 })
    const bPredicts = makeAnswers({ char: 1, style: 1, vibe: 1, fun: 1 })
    report = computeReport(
      makePlayer('Avery', aAnswers, { ...bAnswers }),  // A predicts B exactly
      makePlayer('Blake', bAnswers, bPredicts),         // B guesses wildly for A
    )
  })

  it('overall match = 89 (avg gap = 1)', () => {
    expect(report.scores.overallMatch).toBe(89)
  })
  it('player A avg error = 0', () => {
    expect(report.prediction.playerAAvgError).toBe(0)
  })
  it('player B avg error = 5 (predicted 1, actual 6)', () => {
    expect(report.prediction.playerBAvgError).toBe(5)
  })
  it('A is identified as the better predictor', () => {
    expect(report.prediction.betterPredictor).toBe('a')
  })
  it('knowledgeAsymmetry flag is set (|0 - 5| = 5 ≥ 3)', () => {
    expect(report.flags.knowledgeAsymmetry).toBe(true)
  })
  it('symmetry = 5', () => {
    expect(report.prediction.symmetry).toBe(5)
  })
})

// ── Test 8 · All Neutral ──────────────────────────────────────────────────────
// All 25: A=5, B=5, predictions=5 → all gaps 0 → overall 100%; allNeutral flag
// Spec: neutral detection triggers when > 60% of answers from either player are exactly 5
describe('TC8 · All Neutral', () => {
  let report: BTIReport
  beforeAll(() => {
    const allFives = makeAnswers({ char: 5, style: 5, vibe: 5, fun: 5 })
    report = computeReport(makePlayer('Drew', allFives), makePlayer('Emery', allFives))
  })

  it('overall match = 100', () => {
    expect(report.scores.overallMatch).toBe(100)
  })
  it('no differences', () => {
    expect(report.topDifferences).toHaveLength(0)
  })
  it('allNeutral flag is set (100% of answers are 5)', () => {
    expect(report.flags.allNeutral).toBe(true)
  })
  it('perfectMatch flag is also set', () => {
    expect(report.flags.perfectMatch).toBe(true)
  })
  it('all similarities have SIM_PERFECT tier', () => {
    for (const s of report.topSimilarities) expect(s.tier).toBe('SIM_PERFECT')
  })
})

// ── Test 9 · Extreme Shared Convictions ──────────────────────────────────────
// Char: A=10, B=10 (gap 0); Style: A=9, B=10 (gap 1); Vibe: A=9, B=9 (gap 0); Fun: A=10, B=9 (gap 1)
// Sum = 5×0 + 9×1 + 7×0 + 4×1 = 13; avg = 0.52 → overall = round(94.22) = 94
// Char align = 100; Style align = round((9-1)/9×100) = round(88.89) = 89; Vibe align = 100
// Spec: empty diff pool; top sims dominated by Character questions (sig=45)
describe('TC9 · Extreme Shared Convictions', () => {
  let report: BTIReport
  beforeAll(() => {
    const aA = makeAnswers({ char: 10, style: 9,  vibe: 9, fun: 10 })
    const bA = makeAnswers({ char: 10, style: 10, vibe: 9, fun:  9 })
    report = computeReport(makePlayer('Finley', aA), makePlayer('Harlow', bA))
  })

  it('overall match = 94', () => {
    expect(report.scores.overallMatch).toBe(94)
  })
  it('character alignment = 100', () => {
    expect(report.scores.characterAlignment).toBe(100)
  })
  it('vibe alignment = 100', () => {
    expect(report.scores.vibeAlignment).toBe(100)
  })
  it('style alignment = 89 (avg gap 1)', () => {
    expect(report.scores.styleAlignment).toBe(89)
  })
  it('no differences (all gaps ≤ 1, in sim pool)', () => {
    expect(report.topDifferences).toHaveLength(0)
  })
  it('emptyDifferences flag is set', () => {
    expect(report.flags.emptyDifferences).toBe(true)
  })
  it('top similarities[0] is a Character question (highest significance)', () => {
    const charNums = new Set([11, 15, 17, 22, 25])
    expect(charNums).toContain(report.topSimilarities[0].questionNumber)
  })
  it('Character similarities have SIM_PERFECT tier (gap 0)', () => {
    const charSims = report.topSimilarities.filter(s => [11, 15, 17, 22, 25].includes(s.questionNumber))
    for (const s of charSims) expect(s.tier).toBe('SIM_PERFECT')
  })
})

// ── Test 10 · Single Giant Character Fault Line ───────────────────────────────
// All: A=7, B=7 (gap 0) EXCEPT Q15: A=1, B=10 (gap 9)
// Sum = 24×0 + 9 = 9; avg = 9/25 = 0.36 → overall = round(95.56) = 96
// Char: Q15 gap=9, others 0 → avg = 9/5 = 1.8 → char_align = round((9-1.8)/9×100) = 80
// Style align = 100; Vibe align = 100
// Spec: single Q15 in diff pool (sig=45); conv starter = Q15; other char Qs in sim pool (sig=45)
describe('TC10 · Single Giant Character Fault Line', () => {
  let report: BTIReport
  beforeAll(() => {
    const aA = makeAnswers({ char: 7, style: 7, vibe: 7, fun: 7, overrides: { 15: 1  } })
    const bA = makeAnswers({ char: 7, style: 7, vibe: 7, fun: 7, overrides: { 15: 10 } })
    report = computeReport(makePlayer('Jordan', aA), makePlayer('Sage', bA))
  })

  it('overall match = 96', () => {
    expect(report.scores.overallMatch).toBe(96)
  })
  it('character alignment = 80 (Q15 gap=9, others gap=0)', () => {
    expect(report.scores.characterAlignment).toBe(80)
  })
  it('style alignment = 100', () => {
    expect(report.scores.styleAlignment).toBe(100)
  })
  it('vibe alignment = 100', () => {
    expect(report.scores.vibeAlignment).toBe(100)
  })
  it('exactly 1 difference: Q15', () => {
    expect(report.topDifferences).toHaveLength(1)
    expect(report.topDifferences[0].questionNumber).toBe(15)
  })
  it('Q15 significance = 45 (weight 5 × gap 9)', () => {
    expect(report.topDifferences[0].significance).toBe(45)
  })
  it('Q15 tier = DIFF_LARGE', () => {
    expect(report.topDifferences[0].tier).toBe('DIFF_LARGE')
  })
  it('conversation starter = Q15 (only diff candidate, Character question)', () => {
    expect(report.conversationStarter).not.toBeNull()
    expect(report.conversationStarter!.questionNumber).toBe(15)
  })
  it('remaining 4 Character questions are in top similarities (sig=45, SIM_PERFECT)', () => {
    const charSims = report.topSimilarities.filter(s => [11, 17, 22, 25].includes(s.questionNumber))
    expect(charSims).toHaveLength(4)
    for (const s of charSims) {
      expect(s.significance).toBe(45)
      expect(s.tier).toBe('SIM_PERFECT')
    }
  })
})
