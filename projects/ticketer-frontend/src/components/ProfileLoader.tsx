import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStoredToken, getStoredWallet, getStoredProfile, saveProfile } from '../utils/authStorage'
import { getMe } from '../api/auth'
import { useOnboardingStore } from '../store/onboardingStore'

/**
 * Auto-login: when wallet is connected, restore session from JWT in localStorage.
 * Fetches profile from GET /api/me and populates the store; falls back to stored profile if the API fails.
 */
export default function ProfileLoader() {
  const { activeAddress } = useWallet()
  const { setRole } = useAuth()

  useEffect(() => {
    if (!activeAddress) {
      setRole(null)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const token = getStoredToken()
        const wallet = getStoredWallet()
        if (!token || !wallet || wallet.toLowerCase() !== activeAddress.toLowerCase()) {
          setRole(null)
          return
        }

        const parts = token.split('.')
        if (parts.length !== 3) {
          setRole(null)
          return
        }

        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), '=')
        const json = atob(padded)
        const payload = JSON.parse(json) as { role?: unknown; walletAddress?: unknown; exp?: number }

        if (typeof payload.walletAddress === 'string' && payload.walletAddress.toLowerCase() !== activeAddress.toLowerCase()) {
          setRole(null)
          return
        }
        if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
          setRole(null)
          return
        }
        if (payload.role !== 'organizer' && payload.role !== 'student' && payload.role !== 'gate') {
          setRole(null)
          return
        }

        setRole(payload.role)
        const storeRole = payload.role === 'organizer' ? 'organiser' : payload.role === 'gate' ? 'guard' : 'student'
        useOnboardingStore.getState().setRole(storeRole)

        try {
          const profile = await getMe(token)
          if (cancelled) return
          useOnboardingStore.getState().setFormData({
            name: profile.name,
            email: profile.email,
            interests: profile.hobbies ?? [],
          })
          saveProfile({ name: profile.name, email: profile.email, hobbies: profile.hobbies })
        } catch {
          if (cancelled) return
          const stored = getStoredProfile()
          if (stored) {
            useOnboardingStore.getState().setFormData({
              name: stored.name,
              email: stored.email,
              interests: stored.interests,
            })
          }
        }
      } catch {
        setRole(null)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [activeAddress, setRole])

  return null
}
