import { z } from 'zod'

export type OnboardingPhase =
  | 'intro'
  | 'auth'
  | 'role-selection'
  | 'onboarding'
  | 'complete'
  | 'home'
  | 'profile'
  | 'event-details'
  | 'grouped-events'

export type OnboardingRole = 'student' | 'organiser' | 'guard'

export const nameSchema = z.object({
  name: z
    .string()
    .min(2, 'At least 2 characters')
    .max(50, 'Too long')
    .trim(),
})

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const interestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(1, 'Pick at least one')
    .max(5, 'Maximum 5 interests'),
})

export interface StudentOnboardingData {
  name: string
  email: string
  interests: string[]
}
