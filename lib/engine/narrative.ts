import type { ReportData } from '@/types'

export interface NarrativeSection {
  text: string
  evidence_questions: string[]
  confidence: 'pattern' | 'single_question'
}

export interface NarrativeJSON {
  summary: NarrativeSection
  cluster_insights: Array<{ cluster_name: string } & NarrativeSection>
  fault_lines: Array<{ question_text: string } & NarrativeSection>
  strengths: Array<{ question_text: string } & NarrativeSection>
  bottom_line: string
  conversation_starter: string
}

const SYSTEM_PROMPT = `Output ONLY a raw valid JSON object. Do NOT wrap output in markdown code blocks.
Do NOT include any text, explanation, or preamble before or after the JSON object.
The first character of your response must be { and the last character must be }.

You are Friendzi's report engine. You receive a structured compatibility report computed from two people's answers to a question set, and you produce narrative copy that two real people will read together.

Tone Rule: Maintain a warm, direct, peer-to-peer tone regardless of alignment scores.
Low alignment does not change the voice. Never sound like a therapist, a judge, or a crisis counselor.
Even when two people differ significantly, Friendzi's job is to name the difference clearly and let the people decide what to do with it — not to manage their emotional response to the finding.

Evidence Rule: Never infer a stable personality trait, motive, psychological condition, or causal explanation from a single answer. Interpret patterns across multiple answers wherever possible. When you reference only one question to support a major claim, set confidence to "single_question". When you reference two or more questions, set confidence to "pattern".

Specificity Rule: Every section must reference at least two specific questions from the data by quoting the question text. Do not write general statements that could apply to any pair. Name the actual scores.

Output schema — return exactly this shape:
{
  "summary": {
    "text": "<2-3 sentence overall take on what the report reveals>",
    "evidence_questions": ["<question text>", "<question text>"],
    "confidence": "pattern"
  },
  "cluster_insights": [
    {
      "cluster_name": "<name matching the cluster in the data>",
      "text": "<1-2 sentences on this cluster's gap and what it means>",
      "evidence_questions": ["<question text>", "<question text>"],
      "confidence": "pattern"
    }
  ],
  "fault_lines": [
    {
      "question_text": "<the question with the biggest gap>",
      "text": "<1 sentence naming the difference directly>",
      "evidence_questions": ["<question text>"],
      "confidence": "single_question"
    }
  ],
  "strengths": [
    {
      "question_text": "<a question where they aligned well>",
      "text": "<1 sentence on what this alignment signals>",
      "evidence_questions": ["<question text>"],
      "confidence": "single_question"
    }
  ],
  "bottom_line": "<1 direct sentence summarizing the relationship's defining characteristic>",
  "conversation_starter": "<1 question worth discussing together, grounded in the data>"
}`

function buildUserMessage(
  report: ReportData,
  p1Name: string,
  p2Name: string
): string {
  const faultLines = report.question_gaps
    .filter(g => g.belief_gap >= 4)
    .sort((a, b) => b.belief_gap - a.belief_gap)
    .slice(0, 3)

  const strengths = report.question_gaps
    .filter(g => g.belief_gap <= 1)
    .sort((a, b) => a.belief_gap - b.belief_gap)
    .slice(0, 3)

  return `Generate a Friendzi narrative report for ${p1Name} and ${p2Name}.

Overall belief gap: ${report.belief_gap} (scale 0–9; lower = more aligned)
${p1Name} surprise factor (how well they predicted ${p2Name}): ${report.p1_surprise}
${p2Name} surprise factor (how well they predicted ${p1Name}): ${report.p2_surprise}
GPA: ${report.gpa} | Grade: ${report.letter_grade} | Score: ${report.score}

Cluster scores:
${report.cluster_scores.map(c =>
  `  ${c.cluster_name}: avg gap ${c.avg_gap}, ${c.match_percent}% match (${c.match_count}/${c.total_count} questions)`
).join('\n')}

Biggest gaps (fault lines):
${faultLines.map(g =>
  `  "${g.question_text}" — ${p1Name}: ${g.p1_own}, ${p2Name}: ${g.p2_own} (gap ${g.belief_gap})`
).join('\n') || '  None — all gaps below 4'}

Strongest alignments:
${strengths.map(g =>
  `  "${g.question_text}" — ${p1Name}: ${g.p1_own}, ${p2Name}: ${g.p2_own} (gap ${g.belief_gap})`
).join('\n') || '  None — no gaps of 1 or below'}

All question gaps (for specificity — reference these by question text):
${report.question_gaps.map(g =>
  `  [${g.cluster_name}] "${g.question_text}" — ${p1Name}: ${g.p1_own}, ${p2Name}: ${g.p2_own}, gap: ${g.belief_gap}`
).join('\n')}`
}

function stripFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export async function generateNarrative(
  report: ReportData,
  p1Name: string,
  p2Name: string
): Promise<NarrativeJSON | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserMessage(report, p1Name, p2Name) },
        ],
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    const raw: string = data?.content?.[0]?.text
    if (!raw) return null

    return JSON.parse(stripFences(raw)) as NarrativeJSON
  } catch {
    return null
  }
}
