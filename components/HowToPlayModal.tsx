'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X } from 'lucide-react'

export function HowToPlayModal() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const modal = open ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="How to Play"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-xl max-h-[80dvh] overflow-y-scroll bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-white">How to Play</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8 space-y-8 text-white/90">

          {/* Lede */}
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white leading-snug">
              Friendzi isn&apos;t a quiz. It&apos;s a mirror for two.
            </p>
            <p className="text-base leading-relaxed">
              You and your partner will each answer the same set of questions. But there&apos;s a
              twist: for every question, you&apos;ll also predict how they answered.
            </p>
            <p className="text-base leading-relaxed">
              That&apos;s the whole game. Answer for yourself. Guess for them. Most of all,
              let&apos;s have some fun together.
            </p>
          </div>

          <hr className="border-white/10" />

          {/* Two-step */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest">
              The two-step answer
            </h3>
            <p className="text-base leading-relaxed">
              For each question, you&apos;ll do two things:
            </p>
            <ol className="space-y-2 pl-1">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <p className="text-base leading-relaxed">
                  <strong className="text-white">Your answer</strong> — how you honestly see it.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <p className="text-base leading-relaxed">
                  <strong className="text-white">Your prediction</strong> — what you think they picked.
                </p>
              </li>
            </ol>
            <p className="text-base leading-relaxed">
              Take your time on both. It&apos;s not about being right. It&apos;s about finding out how
              well you actually know yourself and each other.
            </p>
          </div>

          <hr className="border-white/10" />

          {/* Separately */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest">
              Play separately, then compare
            </h3>
            <p className="text-base leading-relaxed">
              You&apos;ll each answer on your own device, privately. Neither of you sees the other&apos;s
              answers until you&apos;re both done.
            </p>
            <p className="text-base leading-relaxed">
              No peeking. No influencing. Just two honest sets of answers, side by side.
            </p>
          </div>

          <hr className="border-white/10" />

          {/* When done */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest">
              When you&apos;re both finished
            </h3>
            <p className="text-base leading-relaxed">
              Once you both submit, Friendzi builds your report — a real read on where you
              match, where you&apos;re surprised, and where you see each other differently than you
              expected.
            </p>
            <p className="text-base leading-relaxed">
              Because every human is genuinely unique, no two reports look the same. That&apos;s
              the point.
            </p>
          </div>

          <hr className="border-white/10" />

          {/* Ready */}
          <div className="space-y-2">
            <p className="text-base font-semibold text-white">Ready?</p>
            <p className="text-base leading-relaxed">
              Answer honestly. Guess boldly. Let&apos;s see how well you really know each other.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-4 shrink-0">
          <Link
            href="/start"
            className="block w-full text-center px-6 py-3.5 bg-[#ED254E] text-white text-base font-bold rounded-full shadow-lg hover:bg-[#d41f45] active:scale-95 transition-all duration-150"
          >
            Start
          </Link>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-8 py-4 border border-white/40 text-white text-xl font-semibold rounded-full hover:bg-white/10 active:scale-95 transition-all duration-150"
      >
        How to Play
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  )
}
