'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Input, Button, FormField, Card, CardBody, CardHeader } from '@roomlink/ui'
import { updateHotelLegalSchema, UpdateHotelLegalInput } from '@/server/validation/hotel-profile.schema'

export function LegalForm({ initial }: { initial: UpdateHotelLegalInput }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateHotelLegalInput>({ resolver: zodResolver(updateHotelLegalSchema), defaultValues: initial })

  async function onSubmit(values: UpdateHotelLegalInput) {
    setSubmitting(true)
    setBanner(null)
    const res = await fetch('/api/v1/hotel/legal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setBanner({ type: 'error', text: data.error ?? 'Something went wrong.' })
      return
    }
    setBanner({ type: 'success', text: 'Legal & GST details saved.' })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {banner && (
        <div
          role="alert"
          className={
            banner.type === 'success'
              ? 'rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
              : 'rounded-md bg-red-50 px-3 py-2 text-sm text-red-700'
          }
        >
          {banner.text}
        </div>
      )}

      <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500">
        Optional during onboarding — complete this before RoomLink billing if your property is
        GST-registered.
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Legal identity</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Legal business name" htmlFor="legalBusinessName" error={errors.legalBusinessName?.message}>
              <Input id="legalBusinessName" {...register('legalBusinessName')} />
            </FormField>
          </div>
          <FormField label="GSTIN" htmlFor="gstin" error={errors.gstin?.message}>
            <Input id="gstin" placeholder="22AAAAA0000A1Z5" {...register('gstin')} />
          </FormField>
          <FormField label="PAN" htmlFor="pan" error={errors.pan?.message}>
            <Input id="pan" placeholder="AAAAA0000A" {...register('pan')} />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Billing</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Billing address" htmlFor="billingAddressLine" error={errors.billingAddressLine?.message}>
              <Input id="billingAddressLine" {...register('billingAddressLine')} />
            </FormField>
          </div>
          <FormField label="City" htmlFor="billingCity" error={errors.billingCity?.message}>
            <Input id="billingCity" {...register('billingCity')} />
          </FormField>
          <FormField label="State" htmlFor="billingState" error={errors.billingState?.message}>
            <Input id="billingState" {...register('billingState')} />
          </FormField>
          <FormField label="Pincode" htmlFor="billingPincode" error={errors.billingPincode?.message}>
            <Input id="billingPincode" {...register('billingPincode')} />
          </FormField>
          <FormField label="Country" htmlFor="billingCountry" error={errors.billingCountry?.message}>
            <Input id="billingCountry" {...register('billingCountry')} />
          </FormField>
          <FormField label="Billing email" htmlFor="billingEmail" error={errors.billingEmail?.message}>
            <Input id="billingEmail" type="email" {...register('billingEmail')} />
          </FormField>
        </CardBody>
      </Card>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save legal & GST'}
      </Button>
    </form>
  )
}
