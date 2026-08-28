'use client'

interface ScaleInputProps {
  value: number | null
  onChange: (v: number) => void
  label: string
}

export function ScaleInput({ value, onChange, label }: ScaleInputProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={[
              'w-10 h-10 rounded-md text-sm font-semibold border transition-all duration-150',
              value === n
                ? 'bg-primary text-primary-foreground border-primary shadow-md scale-110'
                : 'bg-white/5 text-foreground border-border hover:border-primary/60 hover:bg-white/8',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-0.5">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  )
}
