const COLORS: Record<string, string> = {
  matched: 'bg-emerald-100 text-emerald-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  validated: 'bg-emerald-100 text-emerald-700',
  ok: 'bg-emerald-100 text-emerald-700',
  uploaded: 'bg-sky-100 text-sky-700',
  received: 'bg-sky-100 text-sky-700',
  sent: 'bg-amber-100 text-amber-700',
  pending: 'bg-amber-100 text-amber-700',
  not_sent: 'bg-slate-100 text-slate-600',
  missing: 'bg-rose-100 text-rose-700',
  difference: 'bg-rose-100 text-rose-700',
  flagged: 'bg-rose-100 text-rose-700',
  override: 'bg-violet-100 text-violet-700',
  not_applicable: 'bg-slate-200 text-slate-500',
}

const LABELS: Record<string, string> = {
  not_applicable: 'N/A',
}

export default function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? 'bg-slate-100 text-slate-600'
  const label = LABELS[status] ?? status.replace(/_/g, ' ')
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {label}
    </span>
  )
}
