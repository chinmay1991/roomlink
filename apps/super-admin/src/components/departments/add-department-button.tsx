'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddDepartmentModal } from './add-department-modal'

export function AddDepartmentButton({ hotelId, availableTemplates }: { hotelId: string; availableTemplates: readonly string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        Add department
      </Button>
      {open && <AddDepartmentModal hotelId={hotelId} availableTemplates={availableTemplates} onClose={() => setOpen(false)} />}
    </>
  )
}
