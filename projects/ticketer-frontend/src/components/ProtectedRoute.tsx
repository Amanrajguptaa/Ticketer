import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '../context/AuthContext'

function getRoleHome(role: UserRole): string {
  if (role === 'organizer') return '/organizer'
  if (role === 'gate') return '/verify-ticket'
  return '/student-home'
}

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Only these roles can access this route. Empty = no one (redirect to /). */
  allowedRoles: UserRole[]
}

/**
 * Protects routes by role. Redirects to / if not authenticated,
 * or to the user's role home if authenticated but wrong role.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (role === null) {
      navigate('/', { replace: true })
      return
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      navigate(getRoleHome(role), { replace: true })
    }
  }, [role, allowedRoles, navigate])

  if (role === null) {
    return null
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return null
  }

  return <>{children}</>
}

export { getRoleHome }
