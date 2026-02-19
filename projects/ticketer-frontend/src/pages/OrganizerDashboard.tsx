import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { useAuth } from '../context/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { createEvent, listEvents, type Event } from '../api/events'
import { TicketerContractsFactory } from '../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

export default function OrganizerDashboard() {
  const { activeAddress, wallets, transactionSigner } = useWallet()
  const { role, clearRole } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [formStatus, setFormStatus] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    date: '',
    venue: '',
    ticketSupply: 100,
    priceAlgo: '1',
    coverImageUrl: '',
  })

  const goHome = async () => {
    const activeWallet = wallets?.find((w) => w.isActive)
    if (activeWallet) await activeWallet.disconnect()
    clearRole()
    navigate('/')
  }

  useEffect(() => {
    if (!activeAddress) { navigate('/'); return }
    if (role !== 'organizer') { navigate('/'); return }
  }, [activeAddress, role, navigate])

  useEffect(() => {
    if (!activeAddress || role !== 'organizer') return
    let cancelled = false
    setLoading(true)
    listEvents(activeAddress)
      .then((list) => { if (!cancelled) setEvents(list) })
      .catch(() => { if (!cancelled) setEvents([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeAddress, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress) return
    setFormError(null)
    setFormStatus(null)
    setFormLoading(true)

    const priceAlgoNum = parseFloat(form.priceAlgo) || 0
    const priceInMicroAlgos = Math.round(priceAlgoNum * 1_000_000)

    try {
      if (!transactionSigner) {
        setFormError('Wallet signer not available. Please reconnect your wallet.')
        setFormLoading(false)
        return
      }
      // ── Step 1: Deploy smart contract on-chain ───────────────────────
      setFormStatus('Deploying contract on-chain (Pera will ask you to sign)…')

      const algodConfig = getAlgodConfigFromViteEnvironment()
      const indexerConfig = getIndexerConfigFromViteEnvironment()
      const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
      algorand.setDefaultSigner(transactionSigner)
      algorand.account.setSigner(activeAddress, transactionSigner)

      const factory = new TicketerContractsFactory({
        defaultSender: activeAddress,
        algorand,
      })

      const { appClient, result } = await factory.send.create.createEvent({
        args: {
          name: form.name.trim(),
          date: form.date,
          venue: form.venue.trim(),
          supply: form.ticketSupply,
          priceInMicroAlgos,
        },
      })

      const appId = appClient.appClient.appId
      const appAddress = appClient.appAddress

      // ── Step 2: Fund the app (covers MBR when minting NFTs on purchase) ──
      setFormStatus('Funding contract account…')
      await algorand.send.payment({
        sender: activeAddress,
        receiver: appAddress,
        amount: AlgoAmount.MicroAlgos(500_000),
      })

      // ── Step 3: Save to database (each ticket = unique NFT minted on buy) ──
      setFormStatus('Saving event…')
      await createEvent({
        organizerAddress: activeAddress,
        name: form.name.trim(),
        date: form.date,
        venue: form.venue.trim(),
        ticketSupply: form.ticketSupply,
        priceAlgo: form.priceAlgo,
        coverImageUrl: form.coverImageUrl.trim() || undefined,
        appId: String(appId),
        appAddress: String(appAddress),
      })

      setForm({ name: '', date: '', venue: '', ticketSupply: 100, priceAlgo: '1', coverImageUrl: '' })
      setFormStatus(null)
      const list = await listEvents(activeAddress)
      setEvents(list)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create event')
      setFormStatus(null)
    } finally {
      setFormLoading(false)
    }
  }

  if (!activeAddress || role !== 'organizer') return null

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={goHome} className="text-gray-400 hover:text-white">
            ← Back
          </button>
          <span className="font-bold" style={{ color: '#1A56DB' }}>TicketChain</span>
          <span className="text-gray-500">Organizer Dashboard</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{ellipseAddress(activeAddress)}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create Event</h1>

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4 mb-8"
        >
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          {formStatus && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <span className="animate-spin">⏳</span>
              <span>{formStatus}</span>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Event name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500"
              placeholder="e.g. RIFT Hackathon"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date & time</label>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Venue</label>
              <input
                type="text"
                required
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500"
                placeholder="e.g. Main Hall"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ticket supply</label>
              <input
                type="number"
                min={1}
                required
                value={form.ticketSupply}
                onChange={(e) => setForm((f) => ({ ...f, ticketSupply: parseInt(e.target.value, 10) || 1 }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Price (ALGO)</label>
              <input
                type="text"
                value={form.priceAlgo}
                onChange={(e) => setForm((f) => ({ ...f, priceAlgo: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                placeholder="1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cover image URL (optional)</label>
            <input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500"
              placeholder="https://..."
            />
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="btn font-semibold rounded-lg px-6 py-2 disabled:opacity-50"
            style={{ backgroundColor: '#1A56DB', color: '#fff' }}
          >
            {formLoading ? 'Deploying on-chain…' : 'Create Event (on-chain)'}
          </button>
        </form>

        <h2 className="text-xl font-bold mb-4">Your events</h2>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : events.length === 0 ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/5">
            <p className="text-gray-500">No events yet. Create one above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-semibold">{ev.name}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(ev.date).toLocaleString()} · {ev.venue} · {ev.ticketsSold ?? 0}/{ev.ticketSupply} sold · {ev.priceAlgo} ALGO
                  </p>
                  {ev.appId && (
                    <p className="text-xs text-gray-500 mt-1">
                      App #{ev.appId} · NFT per ticket
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
