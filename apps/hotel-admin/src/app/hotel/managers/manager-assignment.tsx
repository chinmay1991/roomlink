'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Select, Button } from '@roomlink/ui'

type Department = {
  department_id: string
  name: string
  is_enabled: boolean
  users: { user_id: string; full_name: string } | null
}
type StaffOption = { user_id: string; full_name: string }

export function ManagerAssignment({ departments, staff }: { departments: Department[]; staff: StaffOption[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selection, setSelection] = useState<Record<string, string>>({})

  async function assign(departmentId: string) {
    const managerId = selection[departmentId]
    if (!managerId) return
    setBusyId(departmentId)
    await fetch(`/api/v1/hotel/departments/${departmentId}/manager`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId }),
    })
    setBusyId(null)
    router.refresh()
  }

  async function remove(departmentId: string) {
    setBusyId(departmentId)
    await fetch(`/api/v1/hotel/departments/${departmentId}/manager`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId: null }),
    })
    setBusyId(null)
    router.refresh()
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Manager</th>
              <th className="px-5 py-3 font-medium">Assign</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <tr key={dept.department_id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{dept.name}</td>
                <td className="px-5 py-3 text-slate-600">
                  {dept.users?.full_name ?? <span className="text-slate-400">None — GM manages directly</span>}
                </td>
                <td className="px-5 py-3">
                  <Select
                    className="h-8 max-w-[200px] text-xs"
                    value={selection[dept.department_id] ?? ''}
                    onChange={(e) => setSelection({ ...selection, [dept.department_id]: e.target.value })}
                  >
                    <option value="">Select staff…</option>
                    {staff.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.full_name}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      disabled={busyId === dept.department_id || !selection[dept.department_id]}
                      onClick={() => assign(dept.department_id)}
                    >
                      Assign
                    </Button>
                    {dept.users && (
                      <Button
                        variant="ghost"
                        className="h-8 px-3 text-xs text-red-600"
                        disabled={busyId === dept.department_id}
                        onClick={() => remove(dept.department_id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                  Enable a department first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
