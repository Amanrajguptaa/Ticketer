import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AppIntro } from '../components/AppIntro'
import { RoleSelection } from '../components/landing-v2/RoleSelection'
import { OnboardingShell } from '../components/landing-v2/OnboardingShell'
import { OnboardingComplete } from '../components/landing-v2/OnboardingComplete'
import GateVerifier from './GateVerifier'
import OrganizerDashboard from './OrganizerDashboard'
import StudentTickets from './StudentTickets'
import { useOnboardingStore } from '../store/onboardingStore'
import type { OnboardingPhase, OnboardingRole } from '../types/onboarding'
import { useNavigate } from 'react-router-dom'

function PlaceholderHome() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-tc-bg flex flex-col items-center justify-center px-6 text-tc-white">
      <h1 className="font-display font-bold text-2xl text-tc-lime mb-4">Home</h1>
      <p className="font-body text-tc-muted mb-6 text-center max-w-md">
        Student / Organiser home. Replace this with your main Home view.
      </p>
      <button
        type="button"
        onClick={() => navigate('/tickets')}
        className="px-4 py-2 rounded-lg font-body font-medium bg-tc-lime text-tc-bg"
      >
        Go to My Tickets
      </button>
    </div>
  )
}

function PlaceholderProfile({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-tc-bg flex flex-col items-center justify-center px-6 text-tc-white">
      <h1 className="font-display font-bold text-2xl text-tc-lime mb-4">Profile</h1>
      <p className="font-body text-tc-muted mb-6 text-center max-w-md">
        Student profile. Replace with your StudentProfile component.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 rounded-lg font-body font-medium border border-tc-border text-tc-white"
      >
        Back
      </button>
    </div>
  )
}

function PlaceholderEventPage() {
  return (
    <div className="min-h-screen bg-tc-bg flex flex-col items-center justify-center px-6 text-tc-white">
      <h1 className="font-display font-bold text-2xl text-tc-lime mb-4">Event details</h1>
      <p className="font-body text-tc-muted text-center max-w-md">
        Event page. Replace with your EventPage component.
      </p>
    </div>
  )
}

function PlaceholderGroupedEvents() {
  return (
    <div className="min-h-screen bg-tc-bg flex flex-col items-center justify-center px-6 text-tc-white">
      <h1 className="font-display font-bold text-2xl text-tc-lime mb-4">Grouped events</h1>
      <p className="font-body text-tc-muted text-center max-w-md">
        Grouped events. Replace with your GroupedEventsPage component.
      </p>
    </div>
  )
}

export default function LandingPageV2() {
  const [phase, setPhase] = useState<OnboardingPhase>('intro')
  const role = useOnboardingStore((s) => s.role)
  const setStoreRole = useOnboardingStore((s) => s.setRole)
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding)

  useEffect(() => {
    useOnboardingStore.setState({
      setPhase: (p: string) => setPhase(p as OnboardingPhase),
    })
  }, [])

  useEffect(() => {
    if (phase === 'onboarding') {
      resetOnboarding()
    }
  }, [phase, resetOnboarding])

  const renderPhase = () => {
    switch (phase) {
      case 'intro':
        return (
          <AppIntro key="intro" onComplete={() => setPhase('role-selection')} />
        )
      case 'role-selection':
        return (
          <RoleSelection
            key="role-selection"
            onSelect={(selectedRole) => {
              setStoreRole(selectedRole)
              setPhase('onboarding')
            }}
          />
        )
      case 'onboarding':
        return <OnboardingShell key="onboarding" />
      case 'complete':
        return (
          <OnboardingComplete key="complete" onFinish={() => setPhase('home')} />
        )
      case 'home':
        if (role === 'guard') {
          return <GateVerifier key="gate-guard" />
        }
        if (role === 'organiser') {
          return <OrganizerDashboard key="organiser-dashboard" />
        }
        if (role === 'student') {
          return <StudentTickets key="student-tickets" />
        }
        return <PlaceholderHome key="home" />
      case 'profile':
        return (
          <PlaceholderProfile
            key="profile"
            onBack={() => setPhase('home')}
          />
        )
      case 'event-details':
        return <PlaceholderEventPage key="event-details" />
      case 'grouped-events':
        return <PlaceholderGroupedEvents key="grouped-events" />
      default:
        return <PlaceholderHome key="home" />
    }
  }

  return <AnimatePresence mode="wait">{renderPhase()}</AnimatePresence>
}
