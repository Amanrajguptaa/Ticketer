import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type UserRole = 'organizer' | 'student' | 'gate'

interface AuthContextValue {
  role: UserRole | null
  setRole: (role: UserRole | null) => void
  clearRole: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null)

  const setRole = useCallback((newRole: UserRole | null) => {
    setRoleState(newRole)
  }, [])

  const clearRole = useCallback(() => {
    setRoleState(null)
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
