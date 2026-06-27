'use client'

import type { Question } from '@/types'
import { ScaleInput } from './ScaleInput'
import { MCInput } from './MCInput'

export interface QuestionAnswer {
  own_value: number | null
  predicted_value: number | null
}

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  answer: QuestionAnswer
  onAnswerChange: (answer: QuestionAnswer) => void
  partnerName: string
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
  partnerName,
}: QuestionCardProps) {
  const setOwn = (v: number) => onAnswerChange({ ...answer, own_value: v })
  const setPredicted = (v: number) => onAnswerChange({ ...answer, predicted_value: v })

  return (
    <div className="space-y-8">
      {/* Question text */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Question {questionNumber} of {totalQuestions}
        </p>
        <h2 className="text-xl font-semibold leading-snug">{question.text}</h2>
      </div>

      {/* Column F — own answer */}
      <div className="rounded-xl border p-5 space-y-4">
        <p className="text-sm font-medium">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
            Column F — Your answer
          </span>
        </p>
        {question.type === 'SCALE' ? (
          <ScaleInput value={answer.own_value} onChange={setOwn} label="" />
        ) : (
          <MCInput
            options={question.options!}
            value={answer.own_value}
            onChange={setOwn}
            label=""
          />
        )}
      </div>

      {/* Column G — predicted answer */}
      <div className="rounded-xl border border-dashed p-5 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-widest block mb-1">
            Column G — What will {partnerName} answer?
          </span>
        </p>
        {question.type === 'SCALE' ? (
          <ScaleInput value={answer.predicted_value} onChange={setPredicted} label="" />
        ) : (
          <MCInput
            options={question.options!}
            value={answer.predicted_value}
            onChange={setPredicted}
            label=""
          />
        )}
      </div>
    </div>
  )
}
