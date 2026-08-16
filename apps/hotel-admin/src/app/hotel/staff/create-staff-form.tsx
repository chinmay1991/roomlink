'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Input, Button, FormField } from '@roomlink/ui'
import { createStaffSchema, CreateStaffInput } from '@/server/validation/staff.schema'

type Department = { department_id: string; name: string }

export function CreateStaffForm({ departments }: { departments: Department[] }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ email: string; password: string } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStaffInput>({ resolver: zodResolver(createStaffSchema), defaultValues: { departmentIds: [] } })

  async function onSubmit(values: CreateStaffInput) {
    setSubmitting(true)
    const res = await fetch('/api/v1/hotel/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, departmentIds: Array.from(selected) }),
    })
    setSubmitting(false)
    if (res.ok) {
      const data = await res.json()
      setResult({ email: data.user.email, password: data.tempPassword })
      reset()
      setSelected(new Set())
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">Add staff</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {result && (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Created {result.email} — temporary password: <code className="font-mono">{result.password}</code>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="fullName" required error={errors.fullName?.message}>
              <Input id="fullName" {...register('fullName')} />
            </FormField>
            <FormField label="Employee ID" htmlFor="employeeId" error={errors.employeeId?.message}>
              <Input id="employeeId" {...register('employeeId')} />
            </FormField>
            <FormField label="Mobile" htmlFor="mobile" error={errors.mobile?.message}>
              <Input id="mobile" {...register('mobile')} />
            </FormField>
            <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
              <Input id="email" type="email" {...register('email')} />
            </FormField>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Departments</p>
            <div className="flex flex-wrap gap-3">
              {departments.map((d) => (
                <label key={d.department_id} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selected.has(d.department_id)}
                    onChange={(e) => {
                      const next = new Set(selected)
                      if (e.target.checked) next.add(d.department_id)
                      else next.delete(d.department_id)
                      setSelected(next)
                    }}
                  />
                  {d.name}
                </label>
              ))}
              {departments.length === 0 && <p className="text-sm text-slate-500">Enable a department first.</p>}
            </div>
            <p className="mt-1 text-xs text-slate-400">A staff member can belong to one or more departments.</p>
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add staff'}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
