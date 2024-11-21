import { z } from 'zod'

export const ToastSchema = z.object({
  description: z.string(),
  id: z.string(),
  title: z.string().optional(),
  type: z.enum(['message', 'success', 'error']).default('message'),
})

export type Toast = z.infer<typeof ToastSchema>
export type ToastInput = z.input<typeof ToastSchema>
