const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Event {
  id: string
  organizerAddress: string
  name: string
  date: string
  venue: string
  ticketSupply: number
  ticketsSold?: number
  priceAlgo: string
  coverImageUrl: string | null
  appId: string | null
  appAddress: string | null
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: string
  eventId: string
  buyerAddress: string
  assetId?: string | null
  purchasedAt: string
  used: boolean
  event: Event
}

export async function listEvents(organizerWallet?: string): Promise<Event[]> {
  const url = organizerWallet
    ? `${API_BASE}/api/events?organizer=${encodeURIComponent(organizerWallet)}`
    : `${API_BASE}/api/events`
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function createEvent(data: {
  organizerAddress: string
  name: string
  date: string
  venue: string
  ticketSupply: number
  priceAlgo: string
  coverImageUrl?: string
  appId?: string
  appAddress?: string
}): Promise<Event> {
  const res = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create event')
  }
  return res.json()
}

export async function buyTicket(
  eventId: string,
  wallet: string,
  assetId?: string | number | bigint,
): Promise<Ticket> {
  const body: { wallet: string; assetId?: string } = { wallet }
  if (assetId != null) body.assetId = String(assetId)
  const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(eventId)}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to buy ticket')
  }
  return res.json()
}

export async function listMyTickets(wallet: string): Promise<Ticket[]> {
  const res = await fetch(
    `${API_BASE}/api/tickets?wallet=${encodeURIComponent(wallet)}`,
    { method: 'GET', headers: { Accept: 'application/json' } },
  )
  if (!res.ok) throw new Error('Failed to fetch tickets')
  return res.json()
}

export interface VerifyResult {
  valid: boolean
  reason?: string
  ticket?: {
    id: string
    buyerAddress: string
    eventName: string
    venue: string
    date: string
  }
  usedTicket?: {
    id: string
    eventName: string
    buyerAddress: string
  }
}

export async function verifyTicket(ticketId: string): Promise<VerifyResult> {
  const res = await fetch(`${API_BASE}/api/tickets/${encodeURIComponent(ticketId)}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  })
  return res.json()
}
