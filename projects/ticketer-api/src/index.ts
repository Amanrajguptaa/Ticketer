import cors from 'cors'
import express from 'express'
import { prisma } from './db.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: true }))
app.use(express.json())

function isDbConnectionError(e: unknown): boolean {
  if (e && typeof e === 'object' && 'message' in e) {
    const msg = String((e as { message?: string }).message)
    return msg.includes('Can\'t reach database server') || msg.includes('P1001')
  }
  return false
}

function normalizeWallet(address: string | undefined): string | null {
  if (!address || typeof address !== 'string') return null
  return address.trim().toLowerCase()
}

// BigInt fields can't be serialized to JSON directly
function serializeEvent(event: Record<string, unknown>) {
  return {
    ...event,
    appId: event.appId != null ? String(event.appId) : null,
  }
}

function serializeTicketAssetId(ticket: Record<string, unknown>) {
  const t = { ...ticket }
  if (t.assetId != null) t.assetId = String(t.assetId)
  return t
}

function serializeTicket(ticket: Record<string, unknown>) {
  let t = { ...ticket }
  if (t.event && typeof t.event === 'object') {
    t = { ...t, event: serializeEvent(t.event as Record<string, unknown>) }
  }
  return serializeTicketAssetId(t)
}

// Health check — use this to verify DB connectivity
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.json({ status: 'ok', db: 'connected' })
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({
        status: 'unavailable',
        db: 'disconnected',
        hint: 'Neon DB unreachable. Check DATABASE_URL, network, or try again (Neon may be waking).',
      })
    }
    return res.status(503).json({ status: 'unavailable', db: 'error' })
  }
})

// GET /api/nft-metadata?appId=... — ARC-3 metadata for ticket NFTs (used as ASA url)
app.get('/api/nft-metadata', async (req, res) => {
  const appIdRaw = req.query.appId
  if (!appIdRaw) {
    return res.status(400).json({ error: 'Missing appId' })
  }
  try {
    const appId = BigInt(String(appIdRaw))
    const event = await prisma.event.findFirst({
      where: { appId },
    })
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`
    const imageUrl = event.coverImageUrl || `${baseUrl}/placeholder-ticket.png`
    const imageFull = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
    const arc3 = {
      standard: 'arc3',
      name: event.name,
      description: `Ticket for ${event.name} at ${event.venue} on ${event.date.toISOString()}`,
      image: imageFull,
      image_mimetype: 'image/png',
      external_url: `${baseUrl}/events/${event.id}`,
      properties: {
        venue: event.venue,
        date: event.date.toISOString(),
        eventId: event.id,
      },
    }
    return res.json(arc3)
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    return res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/profile?wallet=0x...
app.get('/api/profile', async (req, res) => {
  const wallet = normalizeWallet(req.query.wallet as string)
  if (!wallet) {
    return res.status(400).json({ error: 'Missing wallet query parameter' })
  }
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { walletAddress: wallet },
    })
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }
    return res.json({ walletAddress: profile.walletAddress, role: profile.role })
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({
        error: 'Database unavailable',
        hint: 'Neon may be unreachable from this network. Check .env DATABASE_URL or try again in a few seconds.',
      })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// POST /api/profile — sign up: { wallet, role }
app.post('/api/profile', async (req, res) => {
  const wallet = normalizeWallet(req.body?.wallet)
  const role = req.body?.role
  const validRoles = ['organizer', 'student', 'gate']
  if (!wallet) {
    return res.status(400).json({ error: 'Missing wallet' })
  }
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Use organizer, student, or gate' })
  }
  try {
    const existing = await prisma.userProfile.findUnique({
      where: { walletAddress: wallet },
    })
    if (existing) {
      return res.status(409).json({ error: 'Profile already exists', role: existing.role })
    }
    const profile = await prisma.userProfile.create({
      data: { walletAddress: wallet, role },
    })
    return res.status(201).json({ walletAddress: profile.walletAddress, role: profile.role })
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({
        error: 'Database unavailable',
        hint: 'Neon may be unreachable. Check DATABASE_URL or try again in a few seconds.',
      })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/events — list events (optional ?organizer=wallet to filter by organizer)
app.get('/api/events', async (req, res) => {
  const organizer = normalizeWallet(req.query.organizer as string)
  try {
    const events = await prisma.event.findMany({
      where: organizer ? { organizerAddress: organizer } : undefined,
      orderBy: { date: 'asc' },
      include: { _count: { select: { tickets: true } } },
    })
    const result = events.map(({ _count, ...rest }) =>
      serializeEvent({ ...rest, ticketsSold: _count.tickets }),
    )
    return res.json(result)
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// POST /api/events — create event (organizer only)
app.post('/api/events', async (req, res) => {
  const organizerAddress = normalizeWallet(req.body?.organizerAddress ?? req.body?.wallet)
  const name = req.body?.name
  const date = req.body?.date
  const venue = req.body?.venue
  const ticketSupply = req.body?.ticketSupply
  const priceAlgo = req.body?.priceAlgo
  const coverImageUrl = req.body?.coverImageUrl ?? null
  const appId = req.body?.appId != null ? BigInt(req.body.appId) : null
  const appAddress = req.body?.appAddress ?? null

  if (!organizerAddress || !name || !date || !venue) {
    return res.status(400).json({
      error: 'Missing required fields: organizerAddress (or wallet), name, date, venue',
    })
  }
  const supply = typeof ticketSupply === 'number' ? ticketSupply : parseInt(String(ticketSupply), 10)
  const price = priceAlgo != null ? String(priceAlgo) : '0'
  if (isNaN(supply) || supply < 1) {
    return res.status(400).json({ error: 'ticketSupply must be a positive number' })
  }
  try {
    const event = await prisma.event.create({
      data: {
        organizerAddress,
        name: String(name).trim(),
        date: new Date(date),
        venue: String(venue).trim(),
        ticketSupply: supply,
        priceAlgo: price,
        coverImageUrl: coverImageUrl ? String(coverImageUrl) : null,
        appId,
        appAddress: appAddress ? String(appAddress) : null,
      },
    })
    return res.status(201).json(serializeEvent(event))
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/events/:id — single event with ticketsSold count
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { tickets: true } } },
    })
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    const { _count, ...rest } = event
    return res.json(serializeEvent({ ...rest, ticketsSold: _count.tickets }))
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// POST /api/events/:id/buy — buy a ticket { wallet, assetId? } (assetId for on-chain NFT)
app.post('/api/events/:id/buy', async (req, res) => {
  const buyerAddress = normalizeWallet(req.body?.wallet)
  if (!buyerAddress) {
    return res.status(400).json({ error: 'Missing wallet' })
  }
  const assetId = req.body?.assetId != null ? BigInt(req.body.assetId) : null
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { tickets: true } } },
    })
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    if (event._count.tickets >= event.ticketSupply) {
      return res.status(409).json({ error: 'Sold out' })
    }
    const existing = await prisma.ticket.findFirst({
      where: { eventId: event.id, buyerAddress },
    })
    if (existing) {
      return res.status(409).json({ error: 'You already have a ticket for this event', ticketId: existing.id })
    }
    const ticket = await prisma.ticket.create({
      data: { eventId: event.id, buyerAddress, assetId },
      include: { event: true },
    })
    return res.status(201).json(serializeTicket(ticket as unknown as Record<string, unknown>))
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/tickets/:id — fetch one ticket (for gate: get event.appId + buyerAddress before on-chain verify)
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    })
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }
    return res.json(serializeTicket(ticket as unknown as Record<string, unknown>))
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/tickets?wallet=0x... — list tickets for a wallet
app.get('/api/tickets', async (req, res) => {
  const wallet = normalizeWallet(req.query.wallet as string)
  if (!wallet) {
    return res.status(400).json({ error: 'Missing wallet query parameter' })
  }
  try {
    const tickets = await prisma.ticket.findMany({
      where: { buyerAddress: wallet },
      include: { event: true },
      orderBy: { purchasedAt: 'desc' },
    })
    return res.json(tickets.map((t) => serializeTicket(t as unknown as Record<string, unknown>)))
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Database error' })
  }
})

// POST /api/tickets/:id/verify — gate verifier marks ticket as used
app.post('/api/tickets/:id/verify', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    })
    if (!ticket) {
      return res.status(404).json({ valid: false, reason: 'Ticket not found' })
    }
    if (ticket.used) {
      return res.status(409).json({
        valid: false,
        reason: 'Ticket already used',
        usedTicket: {
          id: ticket.id,
          eventName: ticket.event.name,
          buyerAddress: ticket.buyerAddress,
        },
      })
    }
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { used: true },
      include: { event: true },
    })
    return res.json({
      valid: true,
      ticket: {
        id: updated.id,
        buyerAddress: updated.buyerAddress,
        eventName: updated.event.name,
        venue: updated.event.venue,
        date: updated.event.date,
      },
    })
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ valid: false, reason: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ valid: false, reason: 'Server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Ticketer API running at http://localhost:${PORT}`)
  console.log('Health check: GET http://localhost:' + PORT + '/health')
})
