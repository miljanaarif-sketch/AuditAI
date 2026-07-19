export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-8 pb-4 mb-6 bg-slate-50/95 backdrop-blur border-b border-slate-200">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}
