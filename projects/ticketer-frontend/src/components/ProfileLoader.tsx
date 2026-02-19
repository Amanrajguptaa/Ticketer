import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * When wallet is connected, restore role from local auth state (no backend call).
 * This runs on every page so that after refresh we still have the correct role.
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
      const payload = JSON.parse(json) as { role?: unknown; walletAddress?: unknown; exp?: unknown }

      if (typeof payload.walletAddress === 'string' && payload.walletAddress !== activeAddress) {
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
