export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="lg:sticky lg:top-0 z-10 -mx-4 -mt-4 px-4 pt-4 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8 pb-4 mb-6 bg-slate-50/95 backdrop-blur border-b border-slate-200">
      <h1 className="text-xl lg:text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}
