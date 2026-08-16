import { z } from 'zod'
import { uuid } from './common'

export const changePlanSchema = z.object({ planId: uuid })
export type ChangePlanInput = z.infer<typeof changePlanSchema>

export const extendTrialSchema = z.object({ days: z.number().int().min(1).max(90) })
export type ExtendTrialInput = z.infer<typeof extendTrialSchema>
