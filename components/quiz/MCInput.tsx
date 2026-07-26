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
              'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
              selectedLabel === opt.label
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-border hover:border-foreground',
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
