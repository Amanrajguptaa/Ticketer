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
  // Student home feed / nav
  formData: StudentOnboardingData
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedEventId: string | null
  setSelectedEventId: (id: string | null) => void
  selectedCategoryId: string | null
  selectedOrganiserId: string | null
  openOrganiser: (id: string) => void
  openCategory: (id: string) => void
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
  setFormData: (data) =>
    set((s) => {
      const next = { ...s.formData, ...data }
      return { ...s, ...data, formData: next }
    }),
  setName: (name) =>
    set((s) => ({ name, formData: { ...s.formData, name } })),
  setEmail: (email) =>
    set((s) => ({ email, formData: { ...s.formData, email } })),
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
      if (has) {
        const interests = s.interests.filter((x) => x !== id)
        return { interests, formData: { ...s.formData, interests } }
      }
      if (s.interests.length >= 3) return s
      const interests = [...s.interests, id]
      return { interests, formData: { ...s.formData, interests } }
    }),
  resetOnboarding: () =>
    set((s) => ({
      ...initialFormData,
      formData: { ...initialFormData },
      currentStep: 1,
      direction: 'forward',
      role: s.role,
      authMode: s.authMode,
      password: '',
      searchQuery: '',
      selectedEventId: null,
      selectedCategoryId: null,
      selectedOrganiserId: null,
    })),
  formData: { ...initialFormData },
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  selectedCategoryId: null,
  selectedOrganiserId: null,
  openOrganiser: (id) => set({ selectedOrganiserId: id, selectedCategoryId: null }),
  openCategory: (id) => set({ selectedCategoryId: id, selectedOrganiserId: null }),
}))

export function setOnboardingPhaseSetter(fn: (phase: string) => void) {
  useOnboardingStore.setState({ setPhase: fn })
}
