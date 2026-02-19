import { create } from 'zustand'
import type { StudentOnboardingData } from '../types/onboarding'
import type { OnboardingRole } from '../types/onboarding'

type Direction = 'forward' | 'backward'
type AuthMode = 'signup' | 'login'

interface OnboardingState extends StudentOnboardingData {
  role: OnboardingRole | null
  currentStep: number
  direction: Direction
  authMode: AuthMode
  password: string
  setPhase: (phase: string) => void
  setRole: (role: OnboardingRole | null) => void
  setFormData: (data: Partial<StudentOnboardingData>) => void
  setName: (name: string) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setAuthMode: (mode: AuthMode) => void
  nextStep: () => void
  prevStep: () => void
  toggleInterest: (id: string) => void
  resetOnboarding: () => void
}

const initialFormData: StudentOnboardingData = {
  name: '',
  email: '',
  interests: [],
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialFormData,
  role: null,
  currentStep: 1,
  direction: 'forward',
  authMode: 'signup',
  password: '',
  setPhase: () => {},
  setRole: (role) => set({ role }),
  setFormData: (data) => set((s) => ({ ...s, ...data })),
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setAuthMode: (authMode) => set({ authMode }),
  nextStep: () =>
    set((s) => ({
      currentStep: Math.min(s.currentStep + 1, 3),
      direction: 'forward',
    })),
  prevStep: () =>
    set((s) => ({
      currentStep: Math.max(s.currentStep - 1, 1),
      direction: 'backward',
    })),
  toggleInterest: (id) =>
    set((s) => {
      const has = s.interests.includes(id)
      if (has) return { interests: s.interests.filter((x) => x !== id) }
      if (s.interests.length >= 3) return s
      return { interests: [...s.interests, id] }
    }),
  resetOnboarding: () =>
    set((s) => ({
      ...initialFormData,
      currentStep: 1,
      direction: 'forward',
      role: s.role,
      authMode: s.authMode,
      password: '',
    })),
}))

export function setOnboardingPhaseSetter(fn: (phase: string) => void) {
  useOnboardingStore.setState({ setPhase: fn })
}
