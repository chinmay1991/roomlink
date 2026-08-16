import { getHotelInvoices, getHotelHeader } from '@/server/services/hotels.service'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { InvoiceActions } from '@/components/billing/invoice-actions'
import { GenerateInvoiceButton } from '@/components/billing/generate-invoice-button'

export default async function HotelBillingPage({ params }: { params: { hotelId: string } }) {
  const [invoices, hotel] = await Promise.all([getHotelInvoices(params.hotelId), getHotelHeader(params.hotelId)])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {hotel && <GenerateInvoiceButton hotels={[{ hotel_id: hotel.hotel_id, name: hotel.name }]} />}
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No invoices generated for this hotel yet.
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice</th>
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
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
