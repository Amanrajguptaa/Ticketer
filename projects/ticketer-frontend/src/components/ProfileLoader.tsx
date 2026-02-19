import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * When wallet is connected, restore session from localStorage (ticketer.token + ticketer.walletAddress).
 * If valid and not expired, set role so user goes straight to dashboard without logging in again.
 */
export default function ProfileLoader() {
  const { activeAddress } = useWallet()
  const { setRole } = useAuth()

  useEffect(() => {
    if (!activeAddress) {
      setRole(null)
      return
    }

    try {
      const token = localStorage.getItem('ticketer.token')
      const wallet = localStorage.getItem('ticketer.walletAddress')
      if (!token || !wallet || wallet !== activeAddress) {
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

      if (typeof payload.walletAddress === 'string' && payload.walletAddress !== activeAddress) {
        setRole(null)
        return
      }
      // Don't restore expired tokens
      if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
        setRole(null)
        return
      }
      if (payload.role === 'organizer' || payload.role === 'student' || payload.role === 'gate') {
        setRole(payload.role)
        return
      }

      setRole(null)
    } catch {
      setRole(null)
    }
  }, [activeAddress, setRole])

  return null
}
