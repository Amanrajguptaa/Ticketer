const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  const res = await fetch(`${API_BASE}/auth/register`, {
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
  const res = await fetch(`${API_BASE}/auth/login`, {
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

