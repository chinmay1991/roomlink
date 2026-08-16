export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        {title} ships in {phase} of the implementation plan.
      </div>
    </div>
  )
}
