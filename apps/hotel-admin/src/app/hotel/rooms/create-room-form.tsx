'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Input, Button, FormField } from '@roomlink/ui'
import { createRoomSchema, CreateRoomInput } from '@/server/validation/room.schema'

export function CreateRoomForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoomInput>({ resolver: zodResolver(createRoomSchema) })

  async function onSubmit(values: CreateRoomInput) {
    setSubmitting(true)
    const res = await fetch('/api/v1/hotel/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSubmitting(false)
    if (res.ok) {
      reset()
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">Add room</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <FormField label="Room number" htmlFor="roomNumber" required error={errors.roomNumber?.message}>
            <Input id="roomNumber" {...register('roomNumber')} />
          </FormField>
          <FormField label="Floor" htmlFor="floor" error={errors.floor?.message}>
            <Input id="floor" type="number" min={0} max={100} step={1} placeholder="0" {...register('floor')} />
          </FormField>
          <FormField label="Room type" htmlFor="roomType" error={errors.roomType?.message}>
            <Input id="roomType" placeholder="Deluxe" {...register('roomType')} />
          </FormField>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Adding…' : 'Add room'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
