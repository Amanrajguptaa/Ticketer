import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type UserRole = 'organizer' | 'student' | 'gate'

interface AuthContextValue {
  role: UserRole | null
  setRole: (role: UserRole | null) => void
  clearRole: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ROLE_STORAGE_KEY = 'ticketer.role'

function readStoredRole(): UserRole | null {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY)
    if (raw === 'organizer' || raw === 'student' || raw === 'gate') return raw
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(() => readStoredRole())

  const setRole = useCallback((newRole: UserRole | null) => {
    setRoleState(newRole)
    try {
      if (newRole) localStorage.setItem(ROLE_STORAGE_KEY, newRole)
      else localStorage.removeItem(ROLE_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const clearRole = useCallback(() => {
    setRoleState(null)
    try {
      localStorage.removeItem(ROLE_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      setRole,
      clearRole,
    }),
    [role, setRole, clearRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
