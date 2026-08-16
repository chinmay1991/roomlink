'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenerateInvoiceModal } from './generate-invoice-modal'

export function GenerateInvoiceButton({ hotels }: { hotels: { hotel_id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={hotels.length === 0}>
        <Plus className="h-4 w-4" aria-hidden />
        Generate invoice
      </Button>
      {open && <GenerateInvoiceModal hotels={hotels} onClose={() => setOpen(false)} />}
    </>
  )
}
