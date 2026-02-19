import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QrCode } from 'lucide-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { useAuth } from '../context/AuthContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { WalletBalance } from '../components/WalletBalance'
import { createEvent, listEvents, type Event } from '../api/events'
import { TicketerContractsClient, TicketerContractsFactory } from '../contracts/TicketerContracts'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { VerifyTicketDialog } from '../components/VerifyTicketDialog'

type TabId = 'home' | 'events'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-tc-border ${className}`}>
      <div
        className="absolute inset-0 w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />
    </div>
  )
}

function Icon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  )
}

function DrawerIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </Icon>
  )
}

function EventsIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20 6L9 17l-5-5" />
    </Icon>
  )
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H7" />
    </Icon>
  )
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  )
}

function StatCalendarIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  )
}

function StatClockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  )
}

function StatTicketIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v6a3 3 0 01-3 3H5a3 3 0 01-3-3V9z" />
      <path d="M15 9v6M9 9v6" />
    </Icon>
  )
}

function StatCapacityIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </Icon>
  )
}

export default function OrganizerDashboard() {
  const { activeAddress, wallets, transactionSigner } = useWallet()
  const { role, clearRole } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tab, setTab] = useState<TabId>('home')
  const [createOpen, setCreateOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formStatus, setFormStatus] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('') // YYYY-MM-DD or '' for all
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [withdrawDialogEvent, setWithdrawDialogEvent] = useState<Event | null>(null)
  const [withdrawableMicroAlgos, setWithdrawableMicroAlgos] = useState<number | null>(null)
  const [loadingWithdrawable, setLoadingWithdrawable] = useState(false)
  const [withdrawAmountAlgo, setWithdrawAmountAlgo] = useState('')
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
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
    if (!activeAddress) {
      navigate('/')
      return
    }
    if (role !== 'organizer') {
      navigate('/')
      return
    }
  }, [activeAddress, role, navigate])

  useEffect(() => {
    if (!activeAddress || role !== 'organizer') return
    let cancelled = false
    setLoading(true)
    listEvents(activeAddress)
      .then((list) => {
        if (!cancelled) setEvents(list)
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeAddress, role])

  useEffect(() => {
    if (!withdrawDialogEvent?.appAddress) {
      setWithdrawableMicroAlgos(null)
      return
    }
    let cancelled = false
    setLoadingWithdrawable(true)
    setWithdrawableMicroAlgos(null)
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    algorand.account
      .getInformation(withdrawDialogEvent.appAddress)
      .then((info) => {
        if (cancelled) return
        const balance = Number(info.balance.microAlgos)
        const minBal = Number(info.minBalance.microAlgos)
        const withdrawable = Math.max(0, balance - minBal)
        setWithdrawableMicroAlgos(withdrawable)
      })
      .catch(() => {
        if (!cancelled) setWithdrawableMicroAlgos(0)
      })
      .finally(() => {
        if (!cancelled) setLoadingWithdrawable(false)
      })
    return () => {
      cancelled = true
    }
  }, [withdrawDialogEvent?.id, withdrawDialogEvent?.appAddress])

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

      const { appClient } = await factory.send.create.createEvent({
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

      setFormStatus('Funding contract account…')
      await algorand.send.payment({
        sender: activeAddress,
        receiver: appAddress,
        amount: AlgoAmount.MicroAlgos(500_000),
      })

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
      setCreateOpen(false)
      const list = await listEvents(activeAddress)
      setEvents(list)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create event')
      setFormStatus(null)
    } finally {
      setFormLoading(false)
    }
  }

  const handleWithdrawSubmit = async () => {
    const ev = withdrawDialogEvent
    if (!activeAddress || !ev?.appId || !transactionSigner || withdrawableMicroAlgos == null) return
    const amountAlgo = parseFloat(withdrawAmountAlgo.replace(/,/g, ''))
    if (!Number.isFinite(amountAlgo) || amountAlgo <= 0) {
      setWithdrawError('Enter a valid amount')
      return
    }
    const amountMicroAlgos = Math.round(amountAlgo * 1_000_000)
    if (amountMicroAlgos > withdrawableMicroAlgos) {
      setWithdrawError('Amount exceeds available balance')
      return
    }
    setWithdrawError(null)
    setWithdrawingAppId(ev.appId)
    try {
      const algodConfig = getAlgodConfigFromViteEnvironment()
      const indexerConfig = getIndexerConfigFromViteEnvironment()
      const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
      algorand.setDefaultSigner(transactionSigner)
      algorand.account.setSigner(activeAddress, transactionSigner)
      const appClient = new TicketerContractsClient({
        appId: BigInt(ev.appId),
        defaultSender: activeAddress,
        algorand,
      })
      try {
        await appClient.send.withdrawAmount({
          args: { amount: BigInt(amountMicroAlgos) },
          sender: activeAddress,
          signer: transactionSigner,
        })
      } catch (firstErr) {
        const msg = firstErr instanceof Error ? firstErr.message : String(firstErr)
        const isLegacyContract = /logic eval error|err opcode executed/i.test(msg)
        if (isLegacyContract) {
          await appClient.send.withdraw({
            args: {},
            sender: activeAddress,
            signer: transactionSigner,
          })
        } else {
          throw firstErr
        }
      }
      const list = await listEvents(activeAddress)
      setEvents(list)
      setWithdrawDialogEvent(null)
      setWithdrawAmountAlgo('')
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Withdraw failed'
      const isLowBalance = /balance \d+ below min \d+/i.test(raw)
      const appAddr = withdrawDialogEvent?.appAddress ?? ''
      const isContractLow = appAddr && raw.includes(appAddr)
      setWithdrawError(
        isLowBalance
          ? isContractLow
            ? 'The event contract account is below its minimum balance. Fund the contract address with a small amount of ALGO so it can send payments.'
            : 'Your connected wallet (the one you use to sign) needs ALGO to pay the transaction fee — add at least 0.1–0.2 ALGO to that wallet in Pera, not to the event contract.'
          : raw,
      )
    } finally {
      setWithdrawingAppId(null)
    }
  }

  const closeWithdrawDialog = () => {
    if (withdrawingAppId) return
    setWithdrawDialogEvent(null)
    setWithdrawAmountAlgo('')
    setWithdrawError(null)
  }

  const stats = useMemo(() => {
    const totalEvents = events.length
    const totalTicketsSold = events.reduce((s, e) => s + (e.ticketsSold ?? 0), 0)
    const totalCapacity = events.reduce((s, e) => s + e.ticketSupply, 0)
    const upcoming = events.filter((e) => new Date(e.date) >= new Date()).length
    return { totalEvents, totalTicketsSold, totalCapacity, upcoming }
  }, [events])

  const filteredEvents = useMemo(() => {
    let list = events
    if (filterDate) {
      const target = filterDate
      list = list.filter((e) => {
        const d = new Date(e.date)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}` === target
      })
    }
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((e) => e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
  }, [events, search, filterDate])

  if (!activeAddress || role !== 'organizer') return null

  return (
    <div className="min-h-screen flex bg-tc-bg text-tc-white">
      {/* Sidebar — menu icon lives here only; collapses to narrow strip when closed */}
      <aside
        className={`flex-shrink-0 border-r border-tc-border bg-tc-surface transition-[width] duration-200 ease-out overflow-hidden ${
          sidebarOpen ? 'w-52' : 'w-14'
        }`}
      >
        <div className="w-52 min-h-full py-4 flex flex-col">
          {/* Menu (drawer) icon — top of sidebar */}
          <div className="px-3 pb-3 border-b border-tc-border flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-2 rounded-lg text-tc-muted hover:text-tc-white hover:bg-tc-dim transition-colors"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <DrawerIcon className="w-5 h-5" />
            </button>
            {sidebarOpen && <span className="font-display font-bold text-tc-lime tracking-tight">ticketer</span>}
          </div>
          {sidebarOpen && (
            <>
              <p className="font-body text-xs text-tc-muted px-4 pt-3 pb-2">Organizer</p>
              <nav className="flex-1 pt-1 px-2 space-y-0.5">
                <button
                  onClick={() => setTab('home')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors ${
                    tab === 'home'
                      ? 'bg-tc-lime/15 text-tc-lime border border-tc-lime/30'
                      : 'text-tc-muted hover:bg-tc-dim hover:text-tc-white border border-transparent'
                  }`}
                >
                  <HomeIcon className="w-5 h-5 flex-shrink-0" />
                  Home
                </button>
                <button
                  onClick={() => setTab('events')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors ${
                    tab === 'events'
                      ? 'bg-tc-lime/15 text-tc-lime border border-tc-lime/30'
                      : 'text-tc-muted hover:bg-tc-dim hover:text-tc-white border border-transparent'
                  }`}
                >
                  <EventsIcon className="w-5 h-5 flex-shrink-0" />
                  Events
                </button>
              </nav>
              <div className="px-2 pt-4 border-t border-tc-border">
                <button
                  onClick={goHome}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm text-tc-muted hover:bg-tc-dim hover:text-tc-coral transition-colors"
                >
                  <LogOutIcon className="w-5 h-5 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Background — grid, noise, glows, scanlines (same as landing-v2/AppIntro) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(to right, #C8E64A 1px, transparent 1px), linear-gradient(to bottom, #C8E64A 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          <motion.div
            className="absolute -bottom-20 -right-20 w-[320px] h-[320px] rounded-full bg-tc-lime/5 blur-[60px]"
            animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -top-20 -left-20 w-[240px] h-[240px] rounded-full bg-tc-teal/5 blur-[50px]"
            animate={{ x: [0, -10, 0], y: [0, 15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.04)_50%)] bg-[length:100%_4px]" />
        </div>

        {/* Top bar — no menu icon here; it lives in sidebar only */}
        <header className="relative z-10 flex-shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-tc-border bg-tc-surface/80 backdrop-blur-sm">
          <span className="font-body text-sm text-tc-muted">{tab === 'home' ? 'Home' : 'Events'}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVerifyDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-tc-lime/40 text-tc-lime hover:bg-tc-lime/15 transition-colors font-body text-sm font-medium"
            >
              <QrCode className="w-5 h-5" />
              Verify tickets
            </button>
            <WalletBalance address={activeAddress ?? undefined} variant="dark" />
            <button
              type="button"
              className="p-2.5 rounded-lg border border-tc-border text-tc-muted hover:bg-tc-dim hover:text-tc-white hover:border-tc-lime/30 transition-colors"
              aria-label="Profile"
            >
              <ProfileIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 flex-1 overflow-auto p-6">
          {tab === 'home' && (
            <div className="max-w-5xl">
              <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-[-0.03em] leading-none bg-gradient-to-r from-tc-lime via-tc-white to-tc-lime bg-clip-text text-transparent mb-2">
                Welcome back
              </h1>
              <p
                className="font-body text-sm text-tc-muted mb-4 max-w-md"
                style={{
                  background: 'linear-gradient(90deg, #6B6B6B, #C8E64A, #6B6B6B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Here’s a quick overview of your events and tickets.
              </p>
              <div className="h-px w-12 bg-gradient-to-r from-tc-lime/60 to-transparent mb-8" />
              <div className="grid grid-cols-2 gap-5 sm:gap-6 max-w-5xl mb-10">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-6 sm:p-8 rounded-xl border border-tc-border bg-tc-surface/80 backdrop-blur-sm flex flex-col"
                    >
                      <Shimmer className="mb-3 w-10 h-10 rounded-lg" />
                      <Shimmer className="h-3 w-20 rounded" />
                      <Shimmer className="mt-2 h-8 w-16 sm:h-9 sm:w-20 rounded" />
                    </div>
                  ))
                ) : (
                  [
                    { label: 'Total events', value: stats.totalEvents, accent: 'text-tc-lime', icon: StatCalendarIcon },
                    { label: 'Upcoming', value: stats.upcoming, accent: 'text-tc-white', icon: StatClockIcon },
                    { label: 'Tickets sold', value: stats.totalTicketsSold, accent: 'text-tc-teal', icon: StatTicketIcon },
                    { label: 'Total capacity', value: stats.totalCapacity, accent: 'text-tc-white', icon: StatCapacityIcon },
                  ].map(({ label, value, accent, icon: IconComponent }) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-6 sm:p-8 rounded-xl border border-tc-border bg-tc-surface/80 backdrop-blur-sm hover:border-tc-lime/20 transition-colors flex flex-col"
                    >
                      <span
                        className={`mb-3 inline-flex w-10 h-10 rounded-lg items-center justify-center ${accent === 'text-tc-lime' ? 'bg-tc-lime/15 text-tc-lime' : accent === 'text-tc-teal' ? 'bg-tc-teal/15 text-tc-teal' : 'bg-tc-white/10 text-tc-muted'}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </span>
                      <p className="font-body text-xs text-tc-muted uppercase tracking-wider">{label}</p>
                      <p className={`font-display font-bold text-2xl sm:text-3xl mt-2 ${accent}`}>{value}</p>
                    </motion.div>
                  ))
                )}
              </div>
              <button
                onClick={() => setTab('events')}
                className="font-body text-sm text-tc-lime hover:text-tc-lime/80 transition-colors inline-flex items-center gap-1"
              >
                View all events
                <span aria-hidden>→</span>
              </button>
            </div>
          )}

          {tab === 'events' && (
            <div className="max-w-7xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-display font-bold text-xl sm:text-2xl tracking-[-0.03em] bg-gradient-to-r from-tc-lime via-tc-white to-tc-lime bg-clip-text text-transparent">
                    Events
                  </h1>
                  <p
                    className="font-body text-sm mt-1 max-w-md"
                    style={{
                      background: 'linear-gradient(90deg, #6B6B6B, #C8E64A, #6B6B6B)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Create and manage your on-chain ticket events.
                  </p>
                  <div className="h-px w-12 bg-gradient-to-r from-tc-lime/60 to-transparent mt-3" />
                </div>
                {events.length > 0 && (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="flex-shrink-0 px-4 py-2.5 rounded-lg font-body font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 transition-colors border border-tc-lime/30"
                  >
                    Create new
                  </button>
                )}
              </div>

              {loading ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-tc-border bg-tc-raised/80 mb-4">
                    <Shimmer className="h-10 flex-1 min-w-[12rem] max-w-md rounded-lg" />
                    <div className="h-6 w-px bg-tc-border flex-shrink-0" aria-hidden />
                    <Shimmer className="h-10 w-[10.5rem] rounded-lg" />
                  </div>
                  <div className="rounded-xl border border-tc-border bg-tc-surface/80 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left table-fixed">
                        <thead>
                          <tr className="border-b border-tc-border">
                            <th className="font-body text-tc-muted uppercase tracking-wider text-xs px-4 py-3 w-[20%]">Name</th>
                            <th className="font-body text-tc-muted uppercase tracking-wider text-xs px-4 py-3 w-[18%]">Date</th>
                            <th className="font-body text-tc-muted uppercase tracking-wider text-xs px-4 py-3 w-[18%]">Venue</th>
                            <th className="font-body text-tc-muted uppercase tracking-wider text-xs px-4 py-3 w-[12%] text-right">Sold</th>
                            <th className="font-body text-tc-muted uppercase tracking-wider text-xs px-4 py-3 w-[12%] text-right">Supply</th>
                            <th className="font-body text-tc-muted uppercase tracking-wider text-xs px-4 py-3 w-[14%]">Price</th>
                            <th className="font-body text-tc-muted uppercase tracking-wider text-xs px-4 py-3 w-[14%] text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <tr key={i} className="border-b border-tc-border last:border-0">
                              <td className="px-4 py-3"><Shimmer className="h-4 w-full rounded" /></td>
                              <td className="px-4 py-3"><Shimmer className="h-4 w-24 rounded" /></td>
                              <td className="px-4 py-3"><Shimmer className="h-4 w-20 rounded" /></td>
                              <td className="px-4 py-3 text-right"><Shimmer className="h-4 w-8 rounded ml-auto" /></td>
                              <td className="px-4 py-3 text-right"><Shimmer className="h-4 w-8 rounded ml-auto" /></td>
                              <td className="px-4 py-3"><Shimmer className="h-4 w-14 rounded" /></td>
                              <td className="px-4 py-3 text-right"><Shimmer className="h-4 w-20 rounded ml-auto" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : events.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-20 px-6 rounded-xl border border-tc-border bg-tc-surface/80 backdrop-blur-sm text-center"
                >
                  <p className="font-body text-tc-muted mb-2">No events yet.</p>
                  <p
                    className="font-body text-sm mb-8 max-w-sm"
                    style={{
                      background: 'linear-gradient(90deg, #6B6B6B, #C8E64A, #6B6B6B)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Create your first event to start selling NFT tickets on Algorand.
                  </p>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="px-6 py-3 rounded-lg font-body font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 transition-colors border border-tc-lime/30"
                  >
                    Create your first event
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-tc-border bg-tc-raised/80 mb-4">
                    <input
                      type="search"
                      placeholder="Search by name or venue…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 min-w-[12rem] max-w-md px-3 py-2 rounded-lg font-body text-sm bg-tc-surface border border-tc-border text-tc-white placeholder-tc-muted focus:outline-none focus:border-tc-lime/50 focus:ring-1 focus:ring-tc-lime/20"
                    />
                    <div className="h-6 w-px bg-tc-border flex-shrink-0" aria-hidden />
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label htmlFor="filter-date" className="font-body text-xs text-tc-muted uppercase tracking-wider">
                        Date
                      </label>
                      <input
                        id="filter-date"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-[10.5rem] px-3 py-2 rounded-lg font-body text-sm bg-tc-surface border border-tc-border text-tc-white focus:outline-none focus:border-tc-lime/50 focus:ring-1 focus:ring-tc-lime/20 [color-scheme:dark]"
                        aria-label="Filter by date"
                      />
                      {filterDate && (
                        <button
                          type="button"
                          onClick={() => setFilterDate('')}
                          className="px-2 py-1 rounded font-body text-xs text-tc-muted hover:text-tc-coral hover:bg-tc-coral/10 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {withdrawError && (
                    <p className="mb-4 font-body text-sm text-tc-coral">{withdrawError}</p>
                  )}
                  <div className="rounded-xl border border-tc-border bg-tc-surface/80 backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className={`w-full text-left ${filteredEvents.length <= 5 ? 'table-fixed' : ''}`}>
                        <thead>
                          <tr className="border-b border-tc-border">
                            <th
                              className={`font-body text-tc-muted uppercase tracking-wider ${filteredEvents.length <= 5 ? 'text-sm px-5 py-4' : 'text-xs px-4 py-3'}`}
                            >
                              Name
                            </th>
                            <th
                              className={`font-body text-tc-muted uppercase tracking-wider ${filteredEvents.length <= 5 ? 'text-sm px-5 py-4' : 'text-xs px-4 py-3'}`}
                            >
                              Date
                            </th>
                            <th
                              className={`font-body text-tc-muted uppercase tracking-wider ${filteredEvents.length <= 5 ? 'text-sm px-5 py-4' : 'text-xs px-4 py-3'}`}
                            >
                              Venue
                            </th>
                            <th
                              className={`font-body text-tc-muted uppercase tracking-wider text-right ${filteredEvents.length <= 5 ? 'text-sm px-5 py-4' : 'text-xs px-4 py-3'}`}
                            >
                              Sold
                            </th>
                            <th
                              className={`font-body text-tc-muted uppercase tracking-wider text-right ${filteredEvents.length <= 5 ? 'text-sm px-5 py-4' : 'text-xs px-4 py-3'}`}
                            >
                              Supply
                            </th>
                            <th
                              className={`font-body text-tc-muted uppercase tracking-wider ${filteredEvents.length <= 5 ? 'text-sm px-5 py-4' : 'text-xs px-4 py-3'}`}
                            >
                              Price
                            </th>
                            <th
                              className={`font-body text-tc-muted uppercase tracking-wider text-right ${filteredEvents.length <= 5 ? 'text-sm px-5 py-4' : 'text-xs px-4 py-3'}`}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEvents.map((ev) => (
                            <tr key={ev.id} className="border-b border-tc-border last:border-0 hover:bg-tc-dim/50 transition-colors">
                              <td
                                className={`font-body text-tc-white ${filteredEvents.length <= 5 ? 'text-base px-5 py-4' : 'text-sm px-4 py-3'}`}
                              >
                                {ev.name}
                              </td>
                              <td
                                className={`font-body text-tc-muted ${filteredEvents.length <= 5 ? 'text-base px-5 py-4' : 'text-sm px-4 py-3'}`}
                              >
                                {new Date(ev.date).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td
                                className={`font-body text-tc-muted ${filteredEvents.length <= 5 ? 'text-base px-5 py-4' : 'text-sm px-4 py-3'}`}
                              >
                                {ev.venue}
                              </td>
                              <td
                                className={`font-body text-tc-teal text-right ${filteredEvents.length <= 5 ? 'text-base px-5 py-4' : 'text-sm px-4 py-3'}`}
                              >
                                {ev.ticketsSold ?? 0}
                              </td>
                              <td
                                className={`font-body text-tc-muted text-right ${filteredEvents.length <= 5 ? 'text-base px-5 py-4' : 'text-sm px-4 py-3'}`}
                              >
                                {ev.ticketSupply}
                              </td>
                              <td
                                className={`font-body text-tc-muted ${filteredEvents.length <= 5 ? 'text-base px-5 py-4' : 'text-sm px-4 py-3'}`}
                              >
                                {ev.priceAlgo} ALGO
                              </td>
                              <td
                                className={`text-right ${filteredEvents.length <= 5 ? 'px-5 py-4' : 'px-4 py-3'}`}
                              >
                                {ev.appId ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                    setWithdrawError(null)
                                    setWithdrawDialogEvent(ev)
                                  }}
                                    disabled={withdrawingAppId !== null}
                                    className="font-body text-sm px-3 py-1.5 rounded-lg border border-tc-lime/40 text-tc-lime hover:bg-tc-lime/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Withdraw
                                  </button>
                                ) : (
                                  <span className="font-body text-xs text-tc-muted">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredEvents.length === 0 && (
                      <div className="px-4 py-8 text-center font-body text-sm text-tc-muted">No events match your search.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <VerifyTicketDialog
        open={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
      />

      {/* Create Event Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !formLoading && setCreateOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-tc-border bg-tc-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-tc-border">
              <h2 className="font-display font-bold text-lg bg-gradient-to-r from-tc-lime via-tc-white to-tc-lime bg-clip-text text-transparent">
                Create event
              </h2>
              <p
                className="font-body text-sm mt-0.5"
                style={{
                  background: 'linear-gradient(90deg, #6B6B6B, #C8E64A, #6B6B6B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Deploy an on-chain event and start selling NFT tickets.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <p className="font-body text-sm text-tc-coral">{formError}</p>}
              {formStatus && (
                <div className="flex items-center gap-2 font-body text-sm text-tc-lime">
                  <span className="animate-spin">⏳</span>
                  <span>{formStatus}</span>
                </div>
              )}
              <div>
                <label className="block font-body text-sm text-tc-muted mb-1">Event name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg font-body text-sm bg-tc-raised border border-tc-border text-tc-white placeholder-tc-muted focus:outline-none focus:border-tc-lime/50"
                  placeholder="e.g. RIFT Hackathon"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-tc-muted mb-1">Date & time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg font-body text-sm bg-tc-surface border border-tc-border text-tc-white placeholder-tc-muted focus:outline-none focus:border-tc-lime/50 focus:ring-1 focus:ring-tc-lime/20 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm text-tc-muted mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg font-body text-sm bg-tc-raised border border-tc-border text-tc-white placeholder-tc-muted focus:outline-none focus:border-tc-lime/50"
                    placeholder="e.g. Main Hall"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-tc-muted mb-1">Ticket supply</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.ticketSupply}
                    onChange={(e) => setForm((f) => ({ ...f, ticketSupply: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 rounded-lg font-body text-sm bg-tc-raised border border-tc-border text-tc-white focus:outline-none focus:border-tc-lime/50"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm text-tc-muted mb-1">Price (ALGO)</label>
                  <input
                    type="text"
                    value={form.priceAlgo}
                    onChange={(e) => setForm((f) => ({ ...f, priceAlgo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg font-body text-sm bg-tc-raised border border-tc-border text-tc-white placeholder-tc-muted focus:outline-none focus:border-tc-lime/50"
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <label className="block font-body text-sm text-tc-muted mb-1">Cover image URL (optional)</label>
                <input
                  type="url"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg font-body text-sm bg-tc-raised border border-tc-border text-tc-white placeholder-tc-muted focus:outline-none focus:border-tc-lime/50"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !formLoading && setCreateOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-body font-medium text-tc-white border border-tc-border hover:bg-tc-dim transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg font-body font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 disabled:opacity-50 transition-colors"
                >
                  {formLoading ? 'Deploying…' : 'Create event (on-chain)'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Withdraw dialog */}
      {withdrawDialogEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeWithdrawDialog}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-xl border border-tc-border bg-tc-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-tc-border">
              <h2 className="font-display font-bold text-lg bg-gradient-to-r from-tc-lime via-tc-white to-tc-lime bg-clip-text text-transparent">
                Withdraw funds
              </h2>
              <p className="font-body text-sm text-tc-muted mt-0.5">{withdrawDialogEvent.name}</p>
            </div>
            <div className="p-6 space-y-4">
              {withdrawError && <p className="font-body text-sm text-tc-coral">{withdrawError}</p>}
              <div className="rounded-lg border border-tc-border bg-tc-raised/50 p-4">
                <p className="font-body text-xs text-tc-muted uppercase tracking-wider mb-1">Available to withdraw</p>
                {loadingWithdrawable ? (
                  <p className="font-display font-bold text-tc-lime">Loading…</p>
                ) : withdrawableMicroAlgos != null ? (
                  <p className="font-display font-bold text-tc-lime">
                    {(withdrawableMicroAlgos / 1_000_000).toFixed(4)} ALGO
                  </p>
                ) : (
                  <p className="font-body text-sm text-tc-muted">—</p>
                )}
              </div>
              <div>
                <label className="block font-body text-sm text-tc-muted mb-1">Amount (ALGO)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={withdrawAmountAlgo}
                    onChange={(e) => setWithdrawAmountAlgo(e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 rounded-lg font-body text-sm bg-tc-raised border border-tc-border text-tc-white placeholder-tc-muted focus:outline-none focus:border-tc-lime/50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      withdrawableMicroAlgos != null &&
                      setWithdrawAmountAlgo((withdrawableMicroAlgos / 1_000_000).toFixed(4))
                    }
                    disabled={loadingWithdrawable || withdrawableMicroAlgos == null || (withdrawableMicroAlgos ?? 0) <= 0}
                    className="px-3 py-2 rounded-lg font-body text-sm font-medium border border-tc-lime/40 text-tc-lime hover:bg-tc-lime/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeWithdrawDialog}
                  disabled={!!withdrawingAppId}
                  className="flex-1 px-4 py-2.5 rounded-lg font-body font-medium text-tc-white border border-tc-border hover:bg-tc-dim disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWithdrawSubmit}
                  disabled={
                    !!withdrawingAppId ||
                    loadingWithdrawable ||
                    withdrawableMicroAlgos == null ||
                    (withdrawableMicroAlgos ?? 0) <= 0 ||
                    !withdrawAmountAlgo.trim()
                  }
                  className="flex-1 px-4 py-2.5 rounded-lg font-body font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {withdrawingAppId ? 'Withdrawing…' : 'Withdraw'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
