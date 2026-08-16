'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateUserSchema, UpdateUserInput } from '@/server/validation/user.schema'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function EditUserModal({
  userId,
  initial,
  onClose,
}: {
  userId: string
  initial: UpdateUserInput
  onClose: () => void
}) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({ resolver: zodResolver(updateUserSchema), defaultValues: initial })

  async function onSubmit(values: UpdateUserInput) {
    setServerError(null)
    const res = await fetch(`/api/v1/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setServerError(body.error ?? 'Could not save changes.')
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <Modal title="Edit Hotel Admin" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register('fullName')} />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" {...register('phone')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
