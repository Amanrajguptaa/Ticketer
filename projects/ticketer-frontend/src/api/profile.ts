const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export type ProfileRole = 'organizer' | 'student' | 'gate'

export interface Profile {
  walletAddress: string
  role: ProfileRole
}

export async function getProfile(walletAddress: string): Promise<Profile | null> {
  const res = await fetch(
    `${API_BASE}/api/profile?wallet=${encodeURIComponent(walletAddress)}`,
    { method: 'GET', headers: { Accept: 'application/json' } },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json() as Promise<Profile>
}

export async function createProfile(walletAddress: string, role: ProfileRole): Promise<Profile> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ wallet: walletAddress, role }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to create profile')
  }
  return res.json() as Promise<Profile>
}
