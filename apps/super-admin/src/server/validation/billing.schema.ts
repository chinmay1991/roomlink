import { z } from 'zod'
import { uuid } from './common'

export const generateInvoiceSchema = z.object({ hotelId: uuid })
