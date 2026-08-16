'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddIntegrationModal } from './add-integration-modal'

export function AddIntegrationButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        Add integration
      </Button>
      {open && <AddIntegrationModal onClose={() => setOpen(false)} />}
    </>
  )
}
