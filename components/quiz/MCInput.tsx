'use client'

import type { MCOption } from '@/types'

interface MCInputProps {
  options: MCOption[]
  selectedLabel: string | null
  onChange: (value: number, label: string) => void
  label: string
}

export function MCInput({ options, selectedLabel, onChange, label }: MCInputProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="grid gap-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value, opt.label)}
            className={[
              'flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150',
              selectedLabel === opt.label
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.01]'
                : 'bg-white/5 text-foreground border-border hover:border-primary/60 hover:bg-white/8',
            ].join(' ')}
          >
            <span className="font-bold text-sm w-5 shrink-0 mt-0.5">{opt.label}</span>
            <span className="text-sm leading-snug">{opt.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
