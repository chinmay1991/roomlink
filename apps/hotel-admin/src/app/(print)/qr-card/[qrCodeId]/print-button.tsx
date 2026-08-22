'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800"
    >
      Print / Save as PDF
    </button>
  )
}
