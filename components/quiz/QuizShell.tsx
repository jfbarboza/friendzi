'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { Question } from '@/types'
import { QuestionCard, type QuestionAnswer } from './QuestionCard'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface QuizShellProps {
  sessionId: string
  token: string
  questions: Question[]
  playerName: string
  partnerName: string
  clusterName?: string
  devMode?: boolean
}

export function QuizShell({
  sessionId,
  token,
  questions,
  playerName,
  partnerName,
  devMode = false,
}: QuizShellProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>(
    Object.fromEntries(questions.map((q) => [q.id, { own_value: null, own_label: null, predicted_value: null, predicted_label: null }]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = questions[currentIndex]
  const currentAnswer = answers[current.id]
  const isAnswered =
    currentAnswer.own_value !== null && currentAnswer.predicted_value !== null
  const isLast = currentIndex === questions.length - 1
  const progress = Math.round((currentIndex / questions.length) * 100)

  const handleAnswerChange = (answer: QuestionAnswer) => {
    setAnswers((prev) => ({ ...prev, [current.id]: answer }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setDirection(1)
      setCurrentIndex((i) => i + 1)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex((i) => i - 1)
    }
  }

  const handleDevAutoFill = async () => {
    const randomVal = () => Math.ceil(Math.random() * 10)
    const filled = Object.fromEntries(
      questions.map((q) => [
        q.id,
        { own_value: randomVal(), own_label: null, predicted_value: randomVal(), predicted_label: null },
      ])
    )
    setAnswers(filled)
    setSubmitting(true)
    setError(null)
    const payload = questions.map((q) => ({
      question_id: q.id,
      own_value: filled[q.id].own_value!,
      predicted_value: filled[q.id].predicted_value!,
    }))
    try {
      const res = await fetch(`/api/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, player_name: playerName, answers: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      if (data.status === 'complete') {
        router.push(`/report/${sessionId}`)
      } else {
        router.push(`/session/${token}/waiting`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const payload = questions.map((q) => ({
      question_id: q.id,
      own_value: answers[q.id].own_value!,
      predicted_value: answers[q.id].predicted_value!,
    }))

    try {
      const res = await fetch(`/api/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, player_name: playerName, answers: payload }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }

      const data = await res.json()
      if (data.status === 'complete') {
        router.push(`/report/${sessionId}`)
      } else {
        router.push(`/session/${token}/waiting`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <span className="text-xs text-muted-foreground shrink-0">
            {currentIndex + 1} / {questions.length}
          </span>
          <Progress value={progress} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <QuestionCard
              question={current}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              answer={currentAnswer}
              onAnswerChange={handleAnswerChange}
              partnerName={partnerName}
            />
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentIndex === 0}
          >
            ← Back
          </Button>

          <div className="flex items-center gap-2">
            {devMode && (
              <Button
                variant="outline"
                onClick={handleDevAutoFill}
                disabled={submitting}
                className="text-xs border-dashed border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                ⚡ Dev: Auto-fill & Submit
              </Button>
            )}

            {isLast ? (
              <Button
                onClick={handleSubmit}
                disabled={!isAnswered || submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Answers'}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!isAnswered}>
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
