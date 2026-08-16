import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getHotelProfile } from '@/server/services/hotel-profile.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { LegalForm } from './legal-form'

export default async function LegalPage() {
  const session = await requireHotelPageSession()
  const hotel = await getHotelProfile(session.user.hotelId)

  return (
    <div className="space-y-5">
      <SectionTabs section="hotel" />
      <h1 className="text-xl font-semibold text-slate-900">Legal & GST</h1>
      <LegalForm
        initial={{
          legalBusinessName: hotel.legal_business_name ?? '',
          gstin: hotel.gstin ?? '',
          pan: hotel.pan ?? '',
          billingAddressLine: hotel.billing_address_line ?? '',
          billingCity: hotel.billing_city ?? '',
          billingState: hotel.billing_state ?? '',
          billingPincode: hotel.billing_pincode ?? '',
          billingCountry: hotel.billing_country ?? '',
          billingEmail: hotel.billing_email ?? '',
        }}
      />
    </div>
  )
}
