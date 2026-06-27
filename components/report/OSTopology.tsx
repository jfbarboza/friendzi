import { generateOSTopology } from '@/lib/scoring/narrative'
import type { QuestionGap } from '@/types'

interface OSTopologyProps {
  questionGaps: QuestionGap[]
  p1Name: string
  p2Name: string
}

export function OSTopology({ questionGaps, p1Name, p2Name }: OSTopologyProps) {
  const p1Traits = generateOSTopology('p1', questionGaps, p1Name, p2Name)
  const p2Traits = generateOSTopology('p2', questionGaps, p1Name, p2Name)

  return (
    <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2">
      <ProfileCard name={p1Name} traits={p1Traits} />
      <ProfileCard name={p2Name} traits={p2Traits} />
    </div>
  )
}

function ProfileCard({ name, traits }: { name: string; traits: string[] }) {
  return (
    <div className="border rounded-xl p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{name}</p>
      <ul className="space-y-2">
        {traits.map((t, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground">
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
