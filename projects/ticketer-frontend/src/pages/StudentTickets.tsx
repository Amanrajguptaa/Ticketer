import { useWallet } from '@txnlab/use-wallet-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { useAuth } from '../context/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { WalletBalance } from '../components/WalletBalance'
import { listEvents, listMyTickets, buyTicket, type Event, type Ticket } from '../api/events'
import { TicketerContractsClient } from '../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

type Tab = 'browse' | 'mytickets'

export default function StudentTickets() {
  const { activeAddress, wallets, transactionSigner } = useWallet()
  const { role, clearRole } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('browse')
  const [events, setEvents] = useState<Event[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyStatus, setBuyStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const goHome = async () => {
    const activeWallet = wallets?.find((w) => w.isActive)
    if (activeWallet) await activeWallet.disconnect()
    clearRole()
    navigate('/')
  }

  useEffect(() => {
    if (!activeAddress) { navigate('/'); return }
    if (role !== 'student') { navigate('/'); return }
  }, [activeAddress, role, navigate])

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    try { setEvents(await listEvents()) }
    catch { setEvents([]) }
    finally { setLoadingEvents(false) }
  }, [])

  const fetchTickets = useCallback(async () => {
    if (!activeAddress) return
    setLoadingTickets(true)
    try { setTickets(await listMyTickets(activeAddress)) }
    catch { setTickets([]) }
    finally { setLoadingTickets(false) }
  }, [activeAddress])

  useEffect(() => { fetchEvents() }, [fetchEvents])
  useEffect(() => { fetchTickets() }, [fetchTickets])

  const ownedEventIds = new Set(tickets.map((t) => t.eventId))

  const handleBuy = async (event: Event) => {
    if (!activeAddress || buyingId) return
    setError(null)
    setBuyStatus(null)
    setBuyingId(event.id)

    try {
      let nftAssetId: string | number | bigint | undefined
      if (event.appId && event.appAddress) {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorand.setDefaultSigner(transactionSigner)
        algorand.account.setSigner(activeAddress, transactionSigner)

        const appClient = new TicketerContractsClient({
          appId: BigInt(event.appId),
          defaultSender: activeAddress,
          algorand,
        })

        setBuyStatus('Step 1/3: Minting unique NFT ticket (Pera will ask to sign)…')
        const priceInMicroAlgos = Math.round(parseFloat(event.priceAlgo) * 1_000_000)
        const payTxn = await algorand.createTransaction.payment({
          sender: activeAddress,
          receiver: event.appAddress,
          amount: AlgoAmount.MicroAlgos(priceInMicroAlgos),
        })

        // Use a publicly reachable API URL so wallets can fetch metadata and show the ticket as an NFT (not just "asset")
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const metadataUrl = `${API_BASE}/api/nft-metadata?appId=${event.appId}#arc3`

        // Step 1: Mint ticket NFT (no transfer yet)
        const mintResult = await appClient.send.optIn.mintTicket({
          args: { payment: payTxn, metadataUrl },
          extraFee: AlgoAmount.MicroAlgos(2_000),
          sender: activeAddress,
          signer: transactionSigner,
        })
        if (mintResult.return != null) nftAssetId = mintResult.return

        if (nftAssetId == null) {
          throw new Error('Ticket mint did not return an assetId')
        }

        // Step 2: Opt buyer into the newly minted ASA
        setBuyStatus('Step 2/3: Opting wallet into ticket asset…')
        await algorand.send.assetOptIn({
          sender: activeAddress,
          assetId: BigInt(nftAssetId),
          signer: transactionSigner,
        })

        // Step 3: Claim the NFT from the contract
        setBuyStatus('Step 3/3: Claiming NFT ticket from contract…')
        await appClient.send.claimTicket({
          args: { assetId: BigInt(nftAssetId) },
          sender: activeAddress,
          signer: transactionSigner,
        })
      }

      setBuyStatus('Recording purchase…')
      await buyTicket(event.id, activeAddress, nftAssetId)

      await Promise.all([fetchEvents(), fetchTickets()])
      setBuyStatus(null)
      setTab('mytickets')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
      setBuyStatus(null)
    } finally {
      setBuyingId(null)
    }
  }

  if (!activeAddress || role !== 'student') return null

  const tabClass = (t: Tab) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t
      ? 'bg-[#1A56DB] text-white'
      : 'text-gray-400 hover:text-white hover:bg-white/10'
    }`

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={goHome} className="text-gray-400 hover:text-white">
            ← Back
          </button>
          <span className="font-bold" style={{ color: '#1A56DB' }}>TicketChain</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <WalletBalance address={activeAddress ?? undefined} variant="light" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
          </div>
        )}
        {buyStatus && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            <span>{buyStatus}</span>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button className={tabClass('browse')} onClick={() => setTab('browse')}>
            Browse Events
          </button>
          <button className={tabClass('mytickets')} onClick={() => setTab('mytickets')}>
            My Tickets ({tickets.length})
          </button>
        </div>

        {tab === 'browse' && (
          <>
            <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
            {loadingEvents ? (
              <p className="text-gray-500">Loading events…</p>
            ) : events.length === 0 ? (
              <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                <p className="text-gray-500 text-sm">No events available right now.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {events.map((ev) => {
                  const sold = ev.ticketsSold ?? 0
                  const remaining = ev.ticketSupply - sold
                  const soldOut = remaining <= 0
                  const owned = ownedEventIds.has(ev.id)
                  const isBuying = buyingId === ev.id

                  return (
                    <div
                      key={ev.id}
                      className="p-5 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3"
                    >
                      {ev.coverImageUrl && (
                        <img src={ev.coverImageUrl} alt={ev.name} className="w-full h-36 object-cover rounded-lg" />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{ev.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(ev.date).toLocaleDateString(undefined, {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <p className="text-sm text-gray-400">{ev.venue}</p>
                        {ev.appId && (
                          <p className="text-xs text-green-500 mt-1">On-chain · NFT ticket (ARC-3)</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                        <div className="text-sm">
                          <span className="text-white font-medium">{ev.priceAlgo} ALGO</span>
                          <span className="text-gray-500 ml-2">{remaining}/{ev.ticketSupply} left</span>
                        </div>
                        {owned ? (
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 font-medium">
                            Owned ✓
                          </span>
                        ) : soldOut ? (
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 font-medium">
                            Sold Out
                          </span>
                        ) : (
                          <button
                            onClick={() => handleBuy(ev)}
                            disabled={isBuying}
                            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: '#1A56DB' }}
                          >
                            {isBuying ? 'Buying…' : ev.appId ? 'Buy NFT Ticket' : 'Buy Ticket'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'mytickets' && (
          <>
            <h1 className="text-2xl font-bold mb-6">My Tickets</h1>
            {loadingTickets ? (
              <p className="text-gray-500">Loading tickets…</p>
            ) : tickets.length === 0 ? (
              <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                <p className="text-gray-500 text-sm">
                  No tickets yet.{' '}
                  <button onClick={() => setTab('browse')} className="text-[#1A56DB] underline">
                    Browse events
                  </button>{' '}
                  to buy your first ticket.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                  >
                    {t.event.coverImageUrl && (
                      <img src={t.event.coverImageUrl} alt={t.event.name} className="w-full h-36 object-cover" />
                    )}
                    <div className="p-5 flex flex-col gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{t.event.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(t.event.date).toLocaleDateString(undefined, {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <p className="text-sm text-gray-400">{t.event.venue}</p>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                        <div className="bg-white p-2 rounded-lg shrink-0">
                          <QRCodeSVG value={t.id} size={96} level="H" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span
                            className={`self-start text-xs px-2 py-1 rounded-lg font-medium ${t.used
                                ? 'bg-gray-500/20 text-gray-400'
                                : 'bg-green-500/20 text-green-400'
                              }`}
                          >
                            {t.used ? 'Used' : 'Valid'}
                          </span>
                          {t.assetId && (
                            <span className="self-start text-xs px-2 py-1 rounded-lg font-medium bg-blue-500/20 text-blue-400">
                              NFT #{t.assetId}
                            </span>
                          )}
                          <p className="text-xs text-gray-500 truncate">ID: {t.id}</p>
                          <p className="text-xs text-gray-500">
                            Purchased {new Date(t.purchasedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Show this QR at the gate
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
