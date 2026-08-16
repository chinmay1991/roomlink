import Link from 'next/link'
import { Download } from 'lucide-react'
import { listInvoices } from '@/server/services/billing.service'
import { prisma } from '@/server/db'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { GenerateInvoiceButton } from '@/components/billing/generate-invoice-button'
import { InvoiceActions } from '@/components/billing/invoice-actions'

export default async function BillingPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [invoices, hotels] = await Promise.all([
    listInvoices({ status: searchParams.status }),
    prisma.hotels.findMany({ orderBy: { name: 'asc' }, select: { hotel_id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">{invoices.length} invoice{invoices.length === 1 ? '' : 's'} across all hotels.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/v1/billing/invoices/export"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </a>
          <GenerateInvoiceButton hotels={hotels} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Hotel</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.invoice_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{invoice.invoice_number}</td>
                  <td className="px-5 py-3">
                    <Link href={`/hotels/${invoice.hotels.hotel_id}`} className="text-brand-600 hover:text-brand-700">
                      {invoice.hotels.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-slate-600">{formatCurrency(invoice.amount.toString())}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(invoice.due_date)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-5 py-3">
                    <InvoiceActions invoiceId={invoice.invoice_id} status={invoice.status} />
                  </td>
                </tr>
              ))}

              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
