import type { ReportData } from '@/types'
import { generateInvestmentAreas } from '@/lib/scoring/narrative'

interface InvestmentTableProps {
  report: ReportData
  p1Name: string
  p2Name: string
}

export function InvestmentTable({ report, p1Name, p2Name }: InvestmentTableProps) {
  const areas = generateInvestmentAreas(report, p1Name, p2Name)

  if (areas.length === 0) return null

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground w-1/3">Investment Area</th>
          <th className="pb-2 font-semibold text-xs uppercase tracking-widest text-muted-foreground">Why It Matters</th>
        </tr>
      </thead>
      <tbody>
        {areas.map((area, i) => (
          <tr key={i} className="border-b last:border-0 align-top">
            <td className="py-3 pr-4 font-semibold">{area.title}</td>
            <td className="py-3 text-muted-foreground leading-relaxed">{area.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
