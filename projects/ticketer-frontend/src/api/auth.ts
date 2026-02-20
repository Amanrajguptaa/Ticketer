function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL ?? '').trim()
  const unquoted = raw.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim()
  return (unquoted || 'http://localhost:3001').replace(/\/+$/, '')
}

const API_BASE = getApiBase()

/**
 * Auth API: POST /register and POST /login.
 * Both return { token, profile }. Store the JWT with saveAuth() from utils/authStorage;
 * ProfileLoader then uses it for auto-login when the wallet is connected.
 */

export type ApiRole = 'organizer' | 'student' | 'gate'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  hobbies: string[]
  walletAddress: string
  role: ApiRole
}

export interface AuthResponse {
  token: string
  profile: UserProfile
}

export async function registerUser(input: {
  name: string
  email: string
  password: string
  role: ApiRole
  walletAddress: string
  hobbies?: string[]
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || 'Failed to register')
  }
  return res.json()
}

export async function loginUser(input: {
  email: string
  password: string
  walletAddress: string
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || 'Failed to login')
  }
  return res.json()
}

/** Fetch current user profile (name, email, hobbies, etc.) using JWT. */
export async function getMe(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || 'Failed to fetch profile')
  }
  return res.json()
}

