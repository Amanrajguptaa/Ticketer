import { useWallet } from '@txnlab/use-wallet-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Ticket as TicketIcon, Calendar, MapPin, X, ChevronRight } from 'lucide-react'
import { listMyTickets, type Ticket } from '../api/events'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** For a given eventId, get 1-based index and total count of tickets for that event */
function getTicketPosition(tickets: Ticket[], eventId: string, ticketId: string): { current: number; total: number } {
  const forEvent = tickets.filter((t) => t.eventId === eventId)
  const index = forEvent.findIndex((t) => t.id === ticketId)
  return { current: index >= 0 ? index + 1 : 1, total: forEvent.length }
}

function TicketCard({
  ticket,
  index,
  ticketPosition,
  onClick,
}: {
  ticket: Ticket
  index: number
  ticketPosition: { current: number; total: number }
  onClick: () => void
}) {
  const event = ticket.event
  const cover = event.coverImageUrl || PLACEHOLDER_IMAGE
  const hasMultiple = ticketPosition.total > 1

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="rounded-2xl border border-tc-border bg-tc-surface overflow-hidden cursor-pointer
        hover:border-tc-lime/30 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-tc-lime/50"
    >
      <div className="relative h-[140px] sm:h-[160px]">
        <img src={cover} alt={event.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {hasMultiple && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm font-body text-[11px] font-medium text-tc-white">
            Ticket {ticketPosition.current} of {ticketPosition.total}
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-display font-bold text-[17px] sm:text-[18px] text-tc-white leading-tight line-clamp-2">
            {event.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-tc-white/90 font-body text-[12px]">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-tc-white/80 font-body text-[12px]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5">
        <div className="bg-tc-bg rounded-xl p-3 flex items-center justify-center shrink-0 border border-tc-border">
          <QRCodeSVG value={ticket.id} size={100} level="H" className="w-[100px] h-[100px]" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <span
            className={`self-start text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
              ticket.used ? 'bg-tc-muted/20 text-tc-muted' : 'bg-tc-lime/15 text-tc-lime border border-tc-lime/30'
            }`}
          >
            {ticket.used ? 'Used' : 'Valid'}
          </span>
          {ticket.assetId && (
            <span className="font-mono text-[11px] text-tc-muted">NFT #{ticket.assetId}</span>
          )}
          <p className="font-body text-[12px] text-tc-muted">
            Purchased {new Date(ticket.purchasedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </p>
          <p className="font-body text-[12px] text-tc-lime font-medium mt-1">Tap to expand · Show at gate</p>
        </div>
      </div>
    </motion.article>
  )
}

function ExpandedTicketView({
  ticket,
  ticketPosition,
  onClose,
}: {
  ticket: Ticket
  ticketPosition: { current: number; total: number }
  onClose: () => void
}) {
  const event = ticket.event
  const cover = event.coverImageUrl || PLACEHOLDER_IMAGE
  const hasMultiple = ticketPosition.total > 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-md sm:rounded-2xl bg-tc-bg border-t sm:border border-tc-border overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-tc-border bg-tc-surface/80">
          <span className="font-body text-sm text-tc-muted">Ticket details</span>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-tc-raised border border-tc-border flex items-center justify-center text-tc-muted hover:text-tc-white hover:border-tc-lime/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="relative h-[180px] sm:h-[200px]">
            <img src={cover} alt={event.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="font-display font-bold text-[22px] sm:text-[24px] text-tc-white leading-tight">
                {event.name}
              </h2>
              <div className="flex items-center gap-2 mt-2 text-tc-white/90 font-body text-[13px]">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-tc-white/80 font-body text-[13px]">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{event.venue}</span>
              </div>
              {hasMultiple && (
                <p className="mt-2 font-body text-[12px] text-tc-lime font-medium">
                  Ticket {ticketPosition.current} of {ticketPosition.total} for this event
                </p>
              )}
            </div>
          </div>

          <div className="p-5 flex flex-col items-center">
            <p className="font-body text-[12px] text-tc-muted uppercase tracking-wider mb-3">Show at gate</p>
            <div className="bg-tc-bg rounded-2xl p-4 border-2 border-tc-border">
              <QRCodeSVG value={ticket.id} size={200} level="H" className="w-[200px] h-[200px]" />
            </div>
            <span
              className={`mt-4 text-[12px] font-semibold uppercase tracking-wider px-4 py-2 rounded-xl ${
                ticket.used ? 'bg-tc-muted/20 text-tc-muted' : 'bg-tc-lime/15 text-tc-lime border border-tc-lime/30'
              }`}
            >
              {ticket.used ? 'Used' : 'Valid'}
            </span>
            {ticket.assetId && (
              <p className="mt-2 font-mono text-[12px] text-tc-muted">NFT #{ticket.assetId}</p>
            )}
            <p className="mt-2 font-body text-[12px] text-tc-muted">
              Purchased {new Date(ticket.purchasedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function LoadingCard() {
  return (
    <div className="rounded-2xl border border-tc-border bg-tc-surface overflow-hidden animate-pulse">
      <div className="h-[140px] sm:h-[160px] bg-tc-border" />
      <div className="p-4 sm:p-5 flex gap-4">
        <div className="w-[100px] h-[100px] rounded-xl bg-tc-border shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-16 rounded-lg bg-tc-border" />
          <div className="h-3 w-24 rounded bg-tc-border" />
          <div className="h-3 w-32 rounded bg-tc-border" />
        </div>
      </div>
    </div>
  )
}

export default function MyTickets() {
  const { activeAddress } = useWallet()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    if (!activeAddress) return
    setLoading(true)
    try {
      setTickets(await listMyTickets(activeAddress))
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [activeAddress])

  useEffect(() => {
    if (!activeAddress) {
      navigate('/student-home', { replace: true })
      return
    }
    fetchTickets()
  }, [activeAddress, fetchTickets, navigate])

  const handleBack = () => navigate('/student-home')
  const handleExplore = () => navigate('/student-home')

  if (!activeAddress) return null

  return (
    <div className="min-h-screen bg-tc-bg pb-24 md:pb-28">
      <header className="sticky top-0 z-30 bg-tc-bg/80 backdrop-blur-xl border-b border-tc-border/60">
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center gap-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-tc-surface border border-tc-border flex items-center justify-center text-tc-muted hover:border-tc-lime/30 hover:text-tc-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <TicketIcon className="w-5 h-5 md:w-6 md:h-6 text-tc-lime shrink-0" />
            <h1 className="font-display font-bold text-[18px] md:text-[20px] text-tc-white truncate">
              My Tickets
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 md:py-24 text-center"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-tc-surface border border-tc-border flex items-center justify-center mb-5">
              <TicketIcon className="w-10 h-10 md:w-12 md:h-12 text-tc-muted" />
            </div>
            <h2 className="font-display font-bold text-[20px] md:text-[22px] text-tc-white mb-2">
              No tickets yet
            </h2>
            <p className="font-body text-[14px] md:text-[15px] text-tc-muted max-w-[280px] mb-6">
              Your NFT tickets will appear here after you book an event.
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleExplore}
              className="px-6 py-3 rounded-xl font-body font-semibold text-[14px] text-tc-bg bg-tc-lime hover:bg-tc-lime/90 transition-colors border border-tc-lime/50"
            >
              Explore events
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4 md:space-y-5">
              {tickets.map((ticket, i) => {
                const position = getTicketPosition(tickets, ticket.eventId, ticket.id)
                return (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    index={i}
                    ticketPosition={position}
                    onClick={() => setExpandedTicketId(ticket.id)}
                  />
                )
              })}
            </div>

            <AnimatePresence>
              {(() => {
                const expandedTicket = tickets.find((t) => t.id === expandedTicketId)
                if (!expandedTicket) return null
                const position = getTicketPosition(tickets, expandedTicket.eventId, expandedTicket.id)
                return (
                  <ExpandedTicketView
                    key={expandedTicketId}
                    ticket={expandedTicket}
                    ticketPosition={position}
                    onClose={() => setExpandedTicketId(null)}
                  />
                )
              })()}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  )
}
