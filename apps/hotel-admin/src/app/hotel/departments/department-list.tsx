'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, StatusBadge } from '@roomlink/ui'
import { Pencil, Check, X } from 'lucide-react'

type Department = {
  department_id: string
  name: string
  is_custom: boolean
  is_enabled: boolean
  users: { user_id: string; full_name: string } | null
  _count: { user_departments: number }
}

export function DepartmentList({ departments }: { departments: Department[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function toggle(departmentId: string) {
    setBusyId(departmentId)
    await fetch(`/api/v1/hotel/departments/${departmentId}/toggle`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  async function saveRename(departmentId: string) {
    if (!editValue.trim()) return
    setBusyId(departmentId)
    await fetch(`/api/v1/hotel/departments/${departmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editValue.trim() }),
    })
    setBusyId(null)
    setEditingId(null)
    router.refresh()
  }

  if (departments.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-500">No departments enabled yet — pick a template below to get started.</Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Manager</th>
              <th className="px-5 py-3 font-medium">Staff</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <tr key={dept.department_id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  {editingId === dept.department_id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-48"
                        autoFocus
                      />
                      <button onClick={() => saveRename(dept.department_id)} className="text-emerald-600">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{dept.name}</span>
                      {dept.is_custom && <span className="text-xs text-slate-400">custom</span>}
                      <button
                        onClick={() => {
                          setEditingId(dept.department_id)
                          setEditValue(dept.name)
                        }}
                        className="text-slate-300 hover:text-slate-600"
                        aria-label={`Rename ${dept.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{dept.users?.full_name ?? 'None — GM manages directly'}</td>
                <td className="px-5 py-3 text-slate-600">{dept._count.user_departments}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={dept.is_enabled ? 'active' : 'inactive'} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    disabled={busyId === dept.department_id}
                    onClick={() => toggle(dept.department_id)}
                  >
                    {dept.is_enabled ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
