/**
 * JWT auth storage for auto-login. Token, wallet, and profile are stored in localStorage;
 * ProfileLoader reads them when the wallet connects and restores the session + profile (name, email).
 */

export const AUTH_TOKEN_KEY = 'ticketer.token'
export const AUTH_WALLET_KEY = 'ticketer.walletAddress'
export const AUTH_PROFILE_KEY = 'ticketer.profile'

export interface StoredProfile {
  name: string
  email: string
  interests: string[]
}

export function saveAuth(token: string, walletAddress: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_WALLET_KEY, walletAddress)
  } catch {
    // ignore
  }
}

export function saveProfile(profile: { name: string; email: string; hobbies?: string[] }): void {
  try {
    localStorage.setItem(
      AUTH_PROFILE_KEY,
      JSON.stringify({
        name: profile.name ?? '',
        email: profile.email ?? '',
        interests: profile.hobbies ?? [],
      }),
    )
  } catch {
    // ignore
  }
}

export function getStoredProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_PROFILE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as StoredProfile
    return {
      name: typeof data.name === 'string' ? data.name : '',
      email: typeof data.email === 'string' ? data.email : '',
      interests: Array.isArray(data.interests) ? data.interests : [],
    }
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredWallet(): string | null {
  try {
    return localStorage.getItem(AUTH_WALLET_KEY)
  } catch {
    return null
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_WALLET_KEY)
    localStorage.removeItem(AUTH_PROFILE_KEY)
  } catch {
    // ignore
  }
}
