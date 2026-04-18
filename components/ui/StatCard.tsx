interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-bg-surface rounded-lg border border-border p-4 shadow-card">
      <p className="text-2xs font-medium text-text-secondary uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-primary' : 'text-text-primary'}`}>{value}</p>
      {sub && <p className="text-2xs text-text-disabled mt-0.5">{sub}</p>}
    </div>
  )
}
