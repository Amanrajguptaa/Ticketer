import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWallet } from '@txnlab/use-wallet-react'
import { AppIntro } from '../components/AppIntro'
import { AuthPhase } from '../components/landing-v2/AuthPhase'
import { RoleSelection } from '../components/landing-v2/RoleSelection'
import { OnboardingShell } from '../components/landing-v2/OnboardingShell'
import { OnboardingComplete } from '../components/landing-v2/OnboardingComplete'
import { WalletRequiredGate } from '../components/landing-v2/WalletRequiredGate'
import { useAuth } from '../context/AuthContext'
import { getRoleHome } from '../components/ProtectedRoute'
import VerifyTicketPage from './VerifyTicketPage'
import OrganizerDashboard from './OrganizerDashboard'
import StudentTickets from './StudentTickets'
import { useOnboardingStore } from '../store/onboardingStore'
import type { OnboardingPhase } from '../types/onboarding'
import { useNavigate } from 'react-router-dom'

const SESSION_CHECK_MS = 400

export default function LandingPageV2() {
  const navigate = useNavigate()
  const { role: authRole } = useAuth()
  const { activeAddress } = useWallet()
  const [phase, setPhase] = useState<OnboardingPhase>('intro')
  const [sessionChecked, setSessionChecked] = useState(false)
  const role = useOnboardingStore((s) => s.role)
  const authMode = useOnboardingStore((s) => s.authMode)
  const setStoreRole = useOnboardingStore((s) => s.setRole)
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding)

  // Give wallet time to reconnect and ProfileLoader to restore session from localStorage
  useEffect(() => {
    const t = setTimeout(() => setSessionChecked(true), SESSION_CHECK_MS)
    return () => clearTimeout(t)
  }, [])

  // If wallet is connected + valid session in localStorage, ProfileLoader sets role → redirect to dashboard
  useEffect(() => {
    if (authRole) {
      navigate(getRoleHome(authRole), { replace: true })
    }
  }, [authRole, navigate])

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

  useEffect(() => {
    if (phase !== 'home') return
    if (role === 'student') {
      navigate('/student-home', { replace: true })
      return
    }
    if (role === 'guard') {
      navigate('/verify-ticket', { replace: true })
    }
  }, [phase, role, navigate])

  // Don't flash landing when already authenticated (session restored from localStorage)
  if (authRole) {
    return null
  }

  // Brief wait for wallet reconnect + session restore so we don't flash intro then redirect
  if (!sessionChecked) {
    return null
  }

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
              setPhase('auth')
            }}
          />
        )
      case 'auth':
        return (
          <AuthPhase
            key="auth"
            onLoginComplete={() => setPhase('complete')}
            onSignupComplete={() => setPhase('onboarding')}
          />
        )
      case 'onboarding':
        if (authMode === 'signup' && !activeAddress) {
          return <WalletRequiredGate key="wallet-gate" />
        }
        return <OnboardingShell key="onboarding" />
      case 'complete':
        if (authMode === 'signup' && !activeAddress) {
          return <WalletRequiredGate key="wallet-gate" />
        }
        return (
          <OnboardingComplete
            key="complete"
            onFinish={() => setPhase('home')}
            onBackToRoles={() => setPhase('role-selection')}
          />
        )
      case 'home':
        if (role === 'guard') {
          return <VerifyTicketPage key="verify-ticket" />
        }
        if (role === 'organiser') {
          return <OrganizerDashboard key="organiser-dashboard" />
        }
        if (role === 'student') {
          return <StudentTickets key="student-tickets" />
        }
        return null
      default:
        return null
    }
  }

  return <AnimatePresence mode="wait">{renderPhase()}</AnimatePresence>
}
