import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect } from 'react'
import { getProfile } from '../api/profile'
import { useAuth } from '../context/AuthContext'

/**
 * When wallet is connected, fetch profile from backend and set role in auth context.
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
    let cancelled = false
    getProfile(activeAddress)
      .then((profile) => {
        if (!cancelled && profile) setRole(profile.role)
      })
      .catch(() => {
        if (!cancelled) setRole(null)
      })
    return () => {
      cancelled = true
    }
  }, [activeAddress, setRole])

  return null
}
