'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Input, Button, FormField, Card, CardBody, CardHeader } from '@roomlink/ui'
import { updateHotelSettingsSchema, UpdateHotelSettingsInput } from '@/server/validation/hotel-settings.schema'

export function SettingsForm({ initial }: { initial: UpdateHotelSettingsInput }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<UpdateHotelSettingsInput>({
    resolver: zodResolver(updateHotelSettingsSchema),
    defaultValues: initial,
  })

  async function onSubmit(values: UpdateHotelSettingsInput) {
    setSubmitting(true)
    const res = await fetch('/api/v1/hotel/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSubmitting(false)
    if (res.ok) {
      setBanner('Settings saved.')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {banner && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{banner}</div>}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Guest experience</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Welcome message" htmlFor="welcomeMessage">
            <textarea
              id="welcomeMessage"
              rows={3}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              {...register('welcomeMessage')}
            />
          </FormField>
          <FormField label="Guest instructions" htmlFor="guestInstructions">
            <textarea
              id="guestInstructions"
              rows={3}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              {...register('guestInstructions')}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Wi-Fi name" htmlFor="wifiName">
              <Input id="wifiName" {...register('wifiName')} />
            </FormField>
            <FormField label="Wi-Fi password" htmlFor="wifiPassword">
              <Input id="wifiPassword" {...register('wifiPassword')} />
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
        </CardHeader>
        <CardBody className="space-y-2.5">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('notifyCriticalRequests')} />
            Critical guest requests
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('notifyUnassigned')} />
            Unassigned / delayed requests
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('notifyGuestMessages')} />
            Important guest messages
          </label>
        </CardBody>
      </Card>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}
