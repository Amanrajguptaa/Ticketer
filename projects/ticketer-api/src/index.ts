import cors from 'cors'
import express from 'express'
import { prisma } from './db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Secret, SignOptions } from 'jsonwebtoken'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: true }))
app.use(express.json())

type ApiRole = 'organizer' | 'student' | 'gate'

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

function normalizeEmail(email: string | undefined): string | null {
  if (!email || typeof email !== 'string') return null
  const e = email.trim().toLowerCase()
  if (!e) return null
  return e
}

function isValidRole(role: unknown): role is ApiRole {
  return role === 'organizer' || role === 'student' || role === 'gate'
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-only-unsafe-secret'
const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d'

function signAuthToken(payload: { userId: string; walletAddress: string; role: ApiRole }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
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
    const profile = await prisma.userProfile.findFirst({
      where: { walletAddress: wallet },
      orderBy: { createdAt: 'desc' },
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

// POST /auth/register — create account: { name, email, password, role, walletAddress, hobbies? }
async function handleRegister(req: express.Request, res: express.Response) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const email = normalizeEmail(req.body?.email)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const roleRaw = req.body?.role
  const walletAddress = normalizeWallet(req.body?.walletAddress ?? req.body?.wallet)
  const hobbiesRaw = req.body?.hobbies ?? req.body?.interests

  if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' })
  if (!email) return res.status(400).json({ error: 'Invalid email' })
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (!isValidRole(roleRaw)) return res.status(400).json({ error: 'Invalid role. Use organizer, student, or gate' })
  if (!walletAddress) return res.status(400).json({ error: 'Missing walletAddress' })

  const hobbies =
    roleRaw === 'student'
      ? Array.isArray(hobbiesRaw)
        ? hobbiesRaw.filter((x: unknown) => typeof x === 'string').map((x: string) => x.trim()).filter(Boolean)
        : []
      : []

  if (roleRaw === 'student' && hobbies.length < 1) {
    return res.status(400).json({ error: 'Students must provide at least one hobby' })
  }

  try {
    const existingByEmail = await prisma.userProfile.findUnique({ where: { email } })
    if (existingByEmail) {
      return res.status(409).json({ error: 'Account already exists for this email' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const created = await prisma.userProfile.create({
      data: {
        name,
        email,
        password: hashed,
        hobbies,
        walletAddress,
        role: roleRaw,
      },
    })

    const token = signAuthToken({
      userId: created.id,
      walletAddress: created.walletAddress,
      role: created.role as ApiRole,
    })

    return res.status(201).json({
      token,
      profile: {
        id: created.id,
        name: created.name,
        email: created.email,
        avatarUrl: created.avatarUrl,
        hobbies: created.hobbies,
        walletAddress: created.walletAddress,
        role: created.role,
      },
    })
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}
app.post('/register', handleRegister)
app.post('/login', async (req, res) => handleLogin(req, res))

app.post('/auth/register', handleRegister)

async function handleLogin(req: express.Request, res: express.Response) {
  const email = normalizeEmail(req.body?.email)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const walletAddress = normalizeWallet(req.body?.walletAddress ?? req.body?.wallet)

  if (!email) return res.status(400).json({ error: 'Invalid email' })
  if (!password) return res.status(400).json({ error: 'Missing password' })
  if (!walletAddress) return res.status(400).json({ error: 'Missing walletAddress' })

  try {
    const user = await prisma.userProfile.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const pwOk = await bcrypt.compare(password, user.password)
    if (!pwOk) return res.status(401).json({ error: 'Invalid credentials' })

    if (user.walletAddress !== walletAddress) {
      return res.status(401).json({ error: 'Wallet does not match this account' })
    }

    const token = signAuthToken({ userId: user.id, walletAddress: user.walletAddress, role: user.role as ApiRole })
    return res.json({
      token,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        hobbies: user.hobbies,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    })
  } catch (e) {
    if (isDbConnectionError(e)) {
      return res.status(503).json({ error: 'Database unavailable' })
    }
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}

app.post('/auth/login', handleLogin)

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
    const existing = await prisma.userProfile.findFirst({
      where: { walletAddress: wallet },
      orderBy: { createdAt: 'desc' },
    })
    if (existing) {
      return res.status(409).json({ error: 'Profile already exists', role: existing.role })
    }
    const profile = await prisma.userProfile.create({
      data: { walletAddress: wallet, role, name: 'Unnamed', email: `${wallet}@wallet.local`, password: 'legacy', hobbies: [] },
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
